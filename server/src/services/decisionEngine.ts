// ==========================================
// AirOps AI — Decision Engine (Anti-Hallucination)
// Deterministic rules that LLM can NEVER override
// ==========================================

export interface ANACRights {
  communication: boolean;
  food: boolean;
  accommodation: boolean;
  transport: boolean;
  reaccommodation: boolean;
  reschedule: boolean;
  refund: boolean;
  compensation: boolean;
}

export interface DecisionResult {
  decision: string;
  allowedActions: string[];
  blockedActions: string[];
  rights: ANACRights;
  assistanceLevel: 'none' | 'communication' | 'food' | 'full';
  evidence: Record<string, any>;
  ruleApplied: string;
  customerMessage: string;
}

export interface RefundDecision {
  allowed: boolean;
  reason: string;
  alternativeActions: string[];
  ruleApplied: string;
  refundAmount?: number;
  penaltyAmount?: number;
}

// ---- ANAC Resolução 400 — Atraso / Cancelamento ----

export function evaluateFlightDisruption(
  delayMinutes: number,
  isCancelled: boolean,
  isOverbooking: boolean
): DecisionResult {
  const rights: ANACRights = {
    communication: false,
    food: false,
    accommodation: false,
    transport: false,
    reaccommodation: false,
    reschedule: false,
    refund: false,
    compensation: false,
  };

  const allowedActions: string[] = ['inform_status'];
  const blockedActions: string[] = [];
  let assistanceLevel: DecisionResult['assistanceLevel'] = 'none';
  let ruleApplied = 'none';
  let customerMessage = '';

  if (isOverbooking) {
    // Preterição — direitos máximos + compensação
    Object.keys(rights).forEach(k => (rights as any)[k] = true);
    assistanceLevel = 'full';
    ruleApplied = 'ANAC_RES400_OVERBOOKING';
    allowedActions.push('reaccommodate', 'reschedule', 'refund', 'issue_compensation', 'issue_voucher_meal', 'issue_voucher_hotel', 'issue_voucher_transport');
    customerMessage = 'Você foi impedido(a) de embarcar (preterição). Pela ANAC, você tem direito a reacomodação, remarcação ou reembolso integral, além de compensação financeira e assistência material completa.';
  } else if (isCancelled) {
    // Cancelamento — todos os direitos exceto compensação
    rights.communication = true;
    rights.food = true;
    rights.accommodation = true;
    rights.transport = true;
    rights.reaccommodation = true;
    rights.reschedule = true;
    rights.refund = true;
    assistanceLevel = 'full';
    ruleApplied = 'ANAC_RES400_CANCELLATION';
    allowedActions.push('reaccommodate', 'reschedule', 'refund', 'issue_voucher_meal', 'issue_voucher_hotel', 'issue_voucher_transport', 'issue_flight_credit');
    customerMessage = 'Seu voo foi cancelado. Pela Resolução 400 da ANAC, você pode escolher: reacomodação no próximo voo disponível, remarcação para outra data/horário sem custo, ou reembolso integral. Assistência material completa está incluída.';
  } else if (delayMinutes >= 240) {
    rights.communication = true;
    rights.food = true;
    rights.accommodation = true;
    rights.transport = true;
    rights.reaccommodation = true;
    rights.reschedule = true;
    rights.refund = true;
    assistanceLevel = 'full';
    ruleApplied = 'ANAC_RES400_DELAY_4H';
    allowedActions.push('reaccommodate', 'reschedule', 'refund', 'issue_voucher_meal', 'issue_voucher_hotel', 'issue_voucher_transport', 'issue_flight_credit');
    customerMessage = `Seu voo está com atraso de ${delayMinutes} minutos (mais de 4 horas). Você tem direito a reacomodação, remarcação sem custo ou reembolso integral, além de hospedagem e transporte se necessário.`;
  } else if (delayMinutes >= 120) {
    rights.communication = true;
    rights.food = true;
    assistanceLevel = 'food';
    ruleApplied = 'ANAC_RES400_DELAY_2H';
    allowedActions.push('issue_voucher_meal', 'inform_update');
    customerMessage = `Seu voo está com atraso de ${delayMinutes} minutos. Você tem direito a alimentação (voucher refeição) e meios de comunicação.`;
  } else if (delayMinutes >= 60) {
    rights.communication = true;
    assistanceLevel = 'communication';
    ruleApplied = 'ANAC_RES400_DELAY_1H';
    allowedActions.push('inform_update');
    customerMessage = `Seu voo está com atraso de ${delayMinutes} minutos. Você tem direito a meios de comunicação (internet/telefone).`;
  } else if (delayMinutes > 0) {
    ruleApplied = 'ANAC_RES400_DELAY_MINOR';
    allowedActions.push('inform_update');
    customerMessage = `Seu voo está com um pequeno atraso de ${delayMinutes} minutos. Estamos acompanhando e informamos qualquer atualização.`;
  }

  return {
    decision: isCancelled ? 'flight_cancelled' : isOverbooking ? 'denied_boarding' : delayMinutes > 0 ? 'flight_delayed' : 'on_time',
    allowedActions,
    blockedActions,
    rights,
    assistanceLevel,
    evidence: { delayMinutes, isCancelled, isOverbooking },
    ruleApplied,
    customerMessage,
  };
}

// ---- Reembolso ----

export function evaluateRefundEligibility(
  fareRules: { refundable: boolean; change_fee: number; cancel_fee: number; voucher_allowed: boolean; fare_family: string },
  disruptionType: 'voluntary' | 'involuntary',
  ticketAmount: number
): RefundDecision {
  // Involuntário (IROP) = reembolso sempre permitido independente da tarifa
  if (disruptionType === 'involuntary') {
    return {
      allowed: true,
      reason: 'Reembolso integral autorizado por IROP (cancelamento/atraso >4h/preterição). Regra ANAC prevalece sobre tarifa.',
      alternativeActions: ['reaccommodate', 'reschedule', 'issue_flight_credit'],
      ruleApplied: 'ANAC_IROP_REFUND',
      refundAmount: ticketAmount,
      penaltyAmount: 0,
    };
  }

  // Voluntário — depende da tarifa
  if (fareRules.refundable) {
    const penalty = fareRules.cancel_fee || 0;
    return {
      allowed: true,
      reason: `Tarifa ${fareRules.fare_family.toUpperCase()} é reembolsável. Multa de R$ ${penalty.toFixed(2)}.`,
      alternativeActions: ['issue_flight_credit'],
      ruleApplied: 'FARE_RULE_REFUNDABLE',
      refundAmount: ticketAmount - penalty,
      penaltyAmount: penalty,
    };
  }

  // Não reembolsável
  const alternatives: string[] = [];
  if (fareRules.voucher_allowed) alternatives.push('issue_flight_credit');
  if (fareRules.change_fee >= 0) alternatives.push('reschedule');

  return {
    allowed: false,
    reason: `Tarifa ${fareRules.fare_family.toUpperCase()} NÃO é reembolsável. ${alternatives.length > 0 ? 'Alternativas disponíveis: crédito de voo ou remarcação com taxa.' : 'Nenhuma alternativa disponível.'}`,
    alternativeActions: alternatives,
    ruleApplied: 'FARE_RULE_NON_REFUNDABLE',
    refundAmount: 0,
    penaltyAmount: ticketAmount,
  };
}

// ---- Bagagem ----

export function evaluateBaggageRights(isDomestic: boolean, daysMissing: number) {
  const maxDays = isDomestic ? 7 : 21;
  const isLost = daysMissing >= maxDays;

  return {
    status: isLost ? 'lost' : 'missing',
    maxDays,
    daysMissing,
    daysRemaining: Math.max(0, maxDays - daysMissing),
    isLost,
    rights: {
      tracking: true,
      emergencyKit: daysMissing >= 1,
      compensation: isLost,
      delivery: !isLost,
    },
    ruleApplied: isLost ? 'ANAC_BAGGAGE_LOST' : 'ANAC_BAGGAGE_TRACKING',
    customerMessage: isLost
      ? `Sua bagagem ultrapassou o prazo legal de ${maxDays} dias e é considerada perdida. Você tem direito a indenização.`
      : `Sua bagagem está em rastreamento ativo (dia ${daysMissing} de ${maxDays}). Estamos trabalhando para localizá-la.`,
  };
}

// ---- Assistência Material (valores) ----

export function calculateAssistanceVouchers(delayMinutes: number, isDomestic: boolean) {
  const vouchers: { type: string; amount: number; description: string }[] = [];

  if (delayMinutes >= 120) {
    vouchers.push({ type: 'meal', amount: isDomestic ? 30 : 50, description: 'Voucher alimentação' });
  }
  if (delayMinutes >= 240) {
    vouchers.push({ type: 'hotel', amount: isDomestic ? 200 : 350, description: 'Hospedagem (se pernoite)' });
    vouchers.push({ type: 'transport', amount: isDomestic ? 60 : 100, description: 'Transporte aeroporto ↔ hotel' });
  }

  return { vouchers, totalCost: vouchers.reduce((s, v) => s + v.amount, 0) };
}

// ---- Priorização de Resolução (otimização P&L) ----

export function prioritizeResolution(context: {
  disruptionType: 'voluntary' | 'involuntary';
  fareFamily: string;
  loyaltyTier: string;
  ticketAmount: number;
}): string[] {
  // Involuntário: priorizar reacomodação > voucher > crédito > reembolso
  if (context.disruptionType === 'involuntary') {
    const priority = ['reaccommodate', 'reschedule', 'issue_flight_credit'];
    // Clientes premium podem ter reembolso facilitado
    if (context.loyaltyTier === 'diamond' || context.loyaltyTier === 'platinum') {
      priority.push('refund');
    } else {
      priority.push('issue_voucher');
      priority.push('refund');
    }
    return priority;
  }

  // Voluntário: depende da tarifa
  if (context.fareFamily === 'light') {
    return ['inform_no_refund'];
  }
  return ['issue_flight_credit', 'reschedule', 'refund'];
}
