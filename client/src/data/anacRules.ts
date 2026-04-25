// ==========================================
// AirOps AI — ANAC Rules Engine (Client-side)
// Regras Resolução 400 codificadas
// ==========================================

export interface ANACAssistance {
  communication: boolean;
  food: boolean;
  accommodation: boolean;
  transport: boolean;
}

export interface ANACPassengerRights {
  reaccommodation: boolean;
  reschedule: boolean;
  refund: boolean;
  assistanceMaterial: ANACAssistance;
  compensation: boolean;
}

export interface ANACRuleResult {
  applicable: boolean;
  ruleName: string;
  description: string;
  rights: ANACPassengerRights;
  assistanceLevel: string;
  timerMinutes?: number;
  deadlineDays?: number;
  details: string[];
}

// ANAC rules for delays based on time
export function evaluateDelayRules(delayMinutes: number): ANACRuleResult {
  const rights: ANACPassengerRights = {
    reaccommodation: false,
    reschedule: false,
    refund: false,
    assistanceMaterial: { communication: false, food: false, accommodation: false, transport: false },
    compensation: false,
  };

  const details: string[] = [];
  let assistanceLevel = 'none';

  if (delayMinutes >= 60) {
    rights.assistanceMaterial.communication = true;
    details.push('✅ Direito a meios de comunicação (internet/telefone)');
    assistanceLevel = 'communication';
  }

  if (delayMinutes >= 120) {
    rights.assistanceMaterial.food = true;
    details.push('✅ Direito a alimentação (voucher refeição)');
    assistanceLevel = 'food';
  }

  if (delayMinutes >= 240) {
    rights.assistanceMaterial.accommodation = true;
    rights.assistanceMaterial.transport = true;
    rights.reaccommodation = true;
    rights.reschedule = true;
    rights.refund = true;
    assistanceLevel = 'full';
    details.push('✅ Direito a hospedagem (se pernoite necessário)');
    details.push('✅ Direito a transporte aeroporto ↔ hotel');
    details.push('✅ Direito a reacomodação em outro voo');
    details.push('✅ Direito a remarcação sem custo');
    details.push('✅ Direito a reembolso integral');
  }

  if (delayMinutes < 60) {
    details.push('ℹ️ Apenas informação — sem obrigação de assistência material');
  }

  return {
    applicable: delayMinutes > 0,
    ruleName: `Atraso de ${delayMinutes} minutos`,
    description: `Resolução ANAC 400 — Assistência material por atraso`,
    rights,
    assistanceLevel,
    timerMinutes: delayMinutes,
    details,
  };
}

// ANAC rules for cancellation
export function evaluateCancellationRules(): ANACRuleResult {
  return {
    applicable: true,
    ruleName: 'Cancelamento de Voo',
    description: 'Resolução ANAC 400 — Direitos em caso de cancelamento',
    rights: {
      reaccommodation: true,
      reschedule: true,
      refund: true,
      assistanceMaterial: { communication: true, food: true, accommodation: true, transport: true },
      compensation: false,
    },
    assistanceLevel: 'full',
    details: [
      '✅ Direito a reacomodação no próximo voo disponível',
      '✅ Direito a remarcação para data/horário de conveniência',
      '✅ Direito a reembolso integral',
      '✅ Assistência material completa durante a espera',
      '✅ Comunicação imediata ao passageiro com motivo',
      'ℹ️ O passageiro escolhe entre reacomodação, remarcação ou reembolso',
    ],
  };
}

// ANAC rules for denied boarding (overbooking)
export function evaluateDeniedBoardingRules(): ANACRuleResult {
  return {
    applicable: true,
    ruleName: 'Preterição / Negativa de Embarque',
    description: 'Resolução ANAC 400 — Preterição de passageiro',
    rights: {
      reaccommodation: true,
      reschedule: true,
      refund: true,
      assistanceMaterial: { communication: true, food: true, accommodation: true, transport: true },
      compensation: true,
    },
    assistanceLevel: 'full',
    details: [
      '✅ Direito a reacomodação no próximo voo',
      '✅ Direito a remarcação',
      '✅ Direito a reembolso integral',
      '✅ Direito a compensação financeira',
      '✅ Assistência material completa',
      '⚠️ Preterição requer compensação adicional obrigatória',
    ],
  };
}

// ANAC rules for baggage
export function evaluateBaggageRules(isDomestic: boolean, daysMissing: number): ANACRuleResult {
  const maxDays = isDomestic ? 7 : 21;
  const isLost = daysMissing >= maxDays;

  return {
    applicable: true,
    ruleName: isLost ? 'Bagagem Perdida' : 'Bagagem Extraviada',
    description: `Resolução ANAC 400 — ${isDomestic ? 'Voo doméstico' : 'Voo internacional'}`,
    rights: {
      reaccommodation: false,
      reschedule: false,
      refund: isLost,
      assistanceMaterial: { communication: true, food: false, accommodation: false, transport: false },
      compensation: isLost,
    },
    assistanceLevel: 'tracking',
    deadlineDays: maxDays,
    details: isLost
      ? [
          `⚠️ Prazo de ${maxDays} dias ultrapassado — bagagem considerada PERDIDA`,
          '✅ Direito a indenização conforme política',
          '✅ Reembolso de itens de primeira necessidade',
          'ℹ️ Documentação necessária para indenização',
        ]
      : [
          `ℹ️ Prazo legal: ${maxDays} dias para localização (${isDomestic ? 'doméstico' : 'internacional'})`,
          `📅 Dia ${daysMissing} de ${maxDays}`,
          '✅ Rastreamento ativo em andamento',
          '✅ Atualizações periódicas ao passageiro',
        ],
  };
}

// Compiled ANAC timeline data for visualization
export const anacTimeline = [
  {
    time: '0min',
    title: 'Informação Imediata',
    description: 'A companhia deve informar imediatamente o passageiro sobre qualquer atraso, cancelamento ou alteração, incluindo o motivo e a nova previsão.',
    color: '#3b82f6',
  },
  {
    time: '>1h',
    title: 'Meios de Comunicação',
    description: 'Acesso gratuito a internet, telefone ou outros meios de comunicação para o passageiro informar terceiros sobre a situação.',
    color: '#8b5cf6',
  },
  {
    time: '>2h',
    title: 'Alimentação',
    description: 'Voucher de alimentação ou refeição fornecida pela companhia, proporcional ao tempo de espera e horário do dia.',
    color: '#f59e0b',
  },
  {
    time: '>4h',
    title: 'Hospedagem e Transporte',
    description: 'Hospedagem em hotel (se pernoite necessário) e transporte de ida e volta entre o aeroporto e o local de acomodação. Também dá direito a escolha: reacomodação, remarcação ou reembolso.',
    color: '#ef4444',
  },
  {
    time: '7 dias',
    title: 'Bagagem — Voo Doméstico',
    description: 'Prazo máximo para localização de bagagem em voos domésticos. Após esse prazo, a bagagem é considerada perdida e o passageiro tem direito a indenização.',
    color: '#10b981',
  },
  {
    time: '21 dias',
    title: 'Bagagem — Voo Internacional',
    description: 'Prazo máximo para localização de bagagem em voos internacionais. Após esse prazo, a bagagem é considerada perdida com direito a indenização integral.',
    color: '#06b6d4',
  },
];

// Decision priority matrix
export const decisionPriority = {
  companyFault: {
    label: 'Problema da Companhia (IROP)',
    priority: ['Reacomodar', 'Remarcar', 'Crédito/Voucher', 'Reembolso'],
    description: 'Quando o problema é operacional da companhia (atraso, cancelamento, overbooking)',
  },
  voluntaryPassenger: {
    label: 'Pedido Voluntário do Passageiro',
    priority: ['Remarcar', 'Crédito de voo', 'Reembolso (conforme tarifa)'],
    description: 'Quando o passageiro solicita alteração ou cancelamento por conveniência',
  },
  baggageIssue: {
    label: 'Problema de Bagagem',
    priority: ['Registrar PIR', 'Rastrear', 'Entregar no destino', 'Indenizar'],
    description: 'Quando há problema com bagagem extraviada, atrasada ou danificada',
  },
};
