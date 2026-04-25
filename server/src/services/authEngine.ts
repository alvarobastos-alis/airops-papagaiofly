// ==========================================
// AirOps AI — Auth Engine (Session Security)
// Ensures data isolation per customer/session
// ==========================================

import { db } from '../db/sqlite.js';

export type AuthLevel = 'none' | 'pnr_only' | 'pnr_lastname' | 'pnr_lastname_doc' | 'otp_verified';

export interface SessionAuth {
  sessionId: string;
  customerId: string | null;
  pnr: string | null;
  authLevel: AuthLevel;
  authenticated: boolean;
}

export interface ActionAuth {
  action: string;
  requiredLevel: AuthLevel;
  requiresCustomerMatch: boolean;
  requiresPnrMatch: boolean;
}

// ---- Action → Minimum Auth Level ----
const ACTION_AUTH_MAP: Record<string, ActionAuth> = {
  get_flight_status: { action: 'get_flight_status', requiredLevel: 'pnr_only', requiresCustomerMatch: false, requiresPnrMatch: true },
  lookup_pnr: { action: 'lookup_pnr', requiredLevel: 'pnr_lastname', requiresCustomerMatch: false, requiresPnrMatch: true },
  get_passenger_details: { action: 'get_passenger_details', requiredLevel: 'pnr_lastname', requiresCustomerMatch: true, requiresPnrMatch: true },
  get_anac_rules: { action: 'get_anac_rules', requiredLevel: 'none', requiresCustomerMatch: false, requiresPnrMatch: false },
  check_refund_eligibility: { action: 'check_refund_eligibility', requiredLevel: 'pnr_lastname', requiresCustomerMatch: true, requiresPnrMatch: true },
  execute_refund: { action: 'execute_refund', requiredLevel: 'pnr_lastname_doc', requiresCustomerMatch: true, requiresPnrMatch: true },
  execute_rebook: { action: 'execute_rebook', requiredLevel: 'pnr_lastname', requiresCustomerMatch: true, requiresPnrMatch: true },
  issue_voucher: { action: 'issue_voucher', requiredLevel: 'pnr_lastname', requiresCustomerMatch: true, requiresPnrMatch: true },
  transfer_to_human: { action: 'transfer_to_human', requiredLevel: 'none', requiresCustomerMatch: false, requiresPnrMatch: false },
};

// ---- Validate that session can access a PNR ----

export function validatePnrAccess(sessionAuth: SessionAuth, requestedPnr: string): { allowed: boolean; reason: string } {
  // If no PNR set in session yet, allow first lookup
  if (!sessionAuth.pnr) {
    return { allowed: true, reason: 'First PNR lookup in session' };
  }

  // PNR must match session
  if (sessionAuth.pnr !== requestedPnr) {
    return {
      allowed: false,
      reason: 'Não consegui validar a titularidade dessa reserva com os dados informados. Para sua segurança, vou te encaminhar para um atendente.',
    };
  }

  return { allowed: true, reason: 'PNR matches session' };
}

// ---- Check if action is authorized ----

export function isActionAuthorized(sessionAuth: SessionAuth, action: string): { allowed: boolean; reason: string } {
  const authReq = ACTION_AUTH_MAP[action];
  if (!authReq) {
    return { allowed: false, reason: `Action "${action}" not recognized` };
  }

  // Check auth level hierarchy
  const levels: AuthLevel[] = ['none', 'pnr_only', 'pnr_lastname', 'pnr_lastname_doc', 'otp_verified'];
  const sessionLevel = levels.indexOf(sessionAuth.authLevel);
  const requiredLevel = levels.indexOf(authReq.requiredLevel);

  if (sessionLevel < requiredLevel) {
    return {
      allowed: false,
      reason: `Ação "${action}" requer autenticação nível "${authReq.requiredLevel}". Nível atual: "${sessionAuth.authLevel}".`,
    };
  }

  return { allowed: true, reason: 'Authorized' };
}

// ---- Mask sensitive data in output ----

export function maskSensitiveFields(data: Record<string, any>): Record<string, any> {
  const masked = { ...data };
  const sensitiveFields = ['cpf', 'document_number', 'email', 'phone', 'credit_card'];

  for (const key of Object.keys(masked)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      const val = String(masked[key] || '');
      if (key.toLowerCase().includes('cpf') || key.toLowerCase().includes('document')) {
        masked[key] = val.length > 4 ? `***${val.slice(-4)}` : '***';
      } else if (key.toLowerCase().includes('email')) {
        masked[key] = val.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      } else if (key.toLowerCase().includes('phone')) {
        masked[key] = val.length > 4 ? `***${val.slice(-4)}` : '***';
      } else if (key.toLowerCase().includes('credit')) {
        masked[key] = val.length > 4 ? `****-****-****-${val.slice(-4)}` : '****';
      }
    }

    // Recurse into nested objects
    if (masked[key] && typeof masked[key] === 'object' && !Array.isArray(masked[key])) {
      masked[key] = maskSensitiveFields(masked[key]);
    }
  }

  return masked;
}

// ---- Lookup PNR with security scope ----

export function securePnrLookup(locator: string, lastName?: string) {
  const pnr = db.prepare('SELECT * FROM pnr_reservations WHERE locator = ?').get(locator) as any;
  if (!pnr) return { found: false, error: 'PNR não encontrado.' };

  const passengers = db.prepare('SELECT * FROM passengers WHERE pnr = ?').all(locator) as any[];

  // If lastName provided, validate
  if (lastName) {
    const match = passengers.some(p => p.last_name.toLowerCase() === lastName.toLowerCase());
    if (!match) {
      return { found: false, error: 'Sobrenome não corresponde à reserva.' };
    }
  }

  // Get linked flight segments
  const segments = db.prepare(`
    SELECT fs.* FROM flight_segments fs
    JOIN pnr_segments ps ON ps.segment_id = fs.id
    WHERE ps.pnr = ?
    ORDER BY ps.sequence_number
  `).all(locator) as any[];

  // Get tickets with fare rules
  const tickets = db.prepare(`
    SELECT t.*, fr.fare_family, fr.refundable, fr.change_allowed, fr.change_fee,
           fr.cancel_fee, fr.voucher_allowed, fr.free_rebooking_on_irop,
           fr.baggage_included, fr.baggage_weight_kg, fr.description as fare_description
    FROM tickets t
    LEFT JOIN fare_rules fr ON t.fare_basis = fr.fare_basis
    WHERE t.pnr = ?
  `).all(locator) as any[];

  // Get baggage
  const baggage = db.prepare('SELECT * FROM baggage_items WHERE pnr = ?').all(locator) as any[];

  // Get loyalty for primary passenger
  const primaryPax = passengers[0];
  let loyalty = null;
  if (primaryPax?.customer_id) {
    loyalty = db.prepare('SELECT * FROM loyalty_profiles WHERE customer_id = ?').get(primaryPax.customer_id);
  }

  return {
    found: true,
    pnr: {
      ...pnr,
      passengers: passengers.map(p => maskSensitiveFields(p)),
      segments,
      tickets,
      baggage,
      loyalty,
    },
  };
}
