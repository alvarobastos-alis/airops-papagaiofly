// ==========================================
// AirOps AI — Security: PII Masking (Layer 1)
// Removes personal data before sending to LLMs
// ==========================================

export interface PIIEntity {
  type: string;
  original: string;
  masked: string;
  startIndex: number;
  endIndex: number;
}

export interface PIIMaskResult {
  masked: string;
  entities: PIIEntity[];
  hasPII: boolean;
}

// Brazilian PII patterns
const PII_PATTERNS: Record<string, RegExp> = {
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  email: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
  phone_br: /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}/g,
  credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  passport: /\b[A-Z]{2}\d{6,9}\b/g,
  rg: /\b\d{2}\.?\d{3}\.?\d{3}-?[0-9Xx]\b/g,
  cep: /\b\d{5}-?\d{3}\b/g,
  birth_date: /\b\d{2}\/\d{2}\/\d{4}\b/g,
};

// Mask types
const MASK_MAP: Record<string, string> = {
  cpf: '[CPF_REDACTED]',
  email: '[EMAIL_REDACTED]',
  phone_br: '[PHONE_REDACTED]',
  credit_card: '[CC_REDACTED]',
  passport: '[PASSPORT_REDACTED]',
  rg: '[RG_REDACTED]',
  cep: '[CEP_REDACTED]',
  birth_date: '[DOB_REDACTED]',
};

/**
 * Masks PII in text before sending to LLM.
 * Returns the masked text and the list of detected entities (for audit logging).
 */
export function maskPII(text: string): PIIMaskResult {
  let masked = text;
  const entities: PIIEntity[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const original = match[0];
      const maskValue = MASK_MAP[type] || `[${type.toUpperCase()}_REDACTED]`;

      entities.push({
        type,
        original,
        masked: maskValue,
        startIndex: match.index,
        endIndex: match.index + original.length,
      });
    }

    // Apply masking
    masked = masked.replace(pattern, MASK_MAP[type] || `[${type.toUpperCase()}_REDACTED]`);
  }

  return {
    masked,
    entities,
    hasPII: entities.length > 0,
  };
}

/**
 * Unmask PII in response (restore original values).
 * Used for displaying back to the authenticated user only.
 */
export function unmaskPII(text: string, entities: PIIEntity[]): string {
  let result = text;
  for (const entity of entities) {
    result = result.replace(entity.masked, entity.original);
  }
  return result;
}

/**
 * Check if text contains PII without masking.
 */
export function containsPII(text: string): boolean {
  for (const pattern of Object.values(PII_PATTERNS)) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  return false;
}
