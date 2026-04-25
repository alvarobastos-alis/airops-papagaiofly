// ==========================================
// AirOps AI — Tone Engine (Ethical Personalization)
// Adapts communication style based on SAFE signals ONLY
// ==========================================
//
// GUARDRAIL PRINCIPAL:
// > Direitos e opções são definidos por dados operacionais e regras.
// > A linguagem pode ser adaptada por preferência, contexto e necessidade demonstrada.
//
// NUNCA personalizar com base em: idade, local/região, gênero, renda percebida,
// sotaque, escolaridade presumida ou qualquer atributo sensível.
//
// SOMENTE personalizar com base em:
// 1. Preferência declarada pelo cliente
// 2. Contexto da jornada (operacional)
// 3. Urgência operacional
// 4. Sinais conversacionais observados
// 5. Necessidades de acessibilidade explicitamente informadas
// ==========================================

// ---- Conversation Mode (determined by CONTEXT, never by PROFILE) ----

export type ConversationMode = 'informativo' | 'empatico' | 'resolucao' | 'seguranca';

export interface CommunicationPreferences {
  customer_id: string;
  preferred_language: string;      // e.g. 'pt-BR', 'en-US', 'es'
  preferred_channel: string;       // 'voice' | 'chat' | 'whatsapp'
  communication_style: string;     // 'objective' | 'detailed' | 'default'
  accessibility_needs_declared: string | null; // explicitly declared by customer
  allow_personalization: boolean;
}

export interface ConversationSignals {
  session_id: string;
  detected_confusion: boolean;
  detected_frustration: boolean;
  detected_anxiety: boolean;
  requested_human: boolean;
  asked_to_repeat: boolean;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  message_count: number;
}

export interface ToneContext {
  mode: ConversationMode;
  toneGuidance: string;
  systemPromptAddendum: string;
}

// ---- BLOCKED ATTRIBUTES (never used for personalization) ----

const BLOCKED_PERSONALIZATION_ATTRIBUTES = [
  'age', 'birth_date', 'gender', 'sex',
  'city', 'state', 'region', 'country', 'address',
  'income', 'salary', 'social_class',
  'race', 'ethnicity', 'religion',
  'education', 'education_level',
  'accent', 'dialect',
] as const;

// ---- Mode Selection (based on OPERATIONAL context) ----

export function selectConversationMode(
  intent: string,
  disruptionType: string | null,
  signals: Partial<ConversationSignals>,
  securityConcern: boolean = false,
): ConversationMode {
  // Mode 4: Segurança — data inconsistency, access attempt, or sensitive action
  if (securityConcern) return 'seguranca';

  // Mode 2: Empático — disruption situations that impact the passenger
  const disruptiveIntents = [
    'cancel-flight', 'lost-connection', 'denied-boarding', 'resolve-baggage',
  ];
  const disruptiveStatuses = ['cancelled', 'delayed', 'denied_boarding', 'overbooking'];

  if (
    disruptiveIntents.includes(intent) ||
    (disruptionType && disruptiveStatuses.includes(disruptionType)) ||
    signals.detected_frustration ||
    signals.detected_anxiety
  ) {
    return 'empatico';
  }

  // Mode 3: Resolução — transactional actions
  const resolutionIntents = [
    'request-refund', 'change-flight', 'request-assistance',
  ];
  if (resolutionIntents.includes(intent)) return 'resolucao';

  // Mode 1: Informativo — status queries, gate, schedule
  return 'informativo';
}

// ---- Tone Guidance per Mode ----

export function buildToneGuidance(
  mode: ConversationMode,
  signals: Partial<ConversationSignals>,
  preferences: Partial<CommunicationPreferences>,
): ToneContext {
  let toneGuidance: string;
  let systemPromptAddendum: string;

  switch (mode) {
    case 'informativo':
      toneGuidance = 'Objetivo e direto. Informe status, horário atualizado e próximo passo.';
      systemPromptAddendum = `[MODO INFORMATIVO] Seja objetivo, informe status, horário atualizado e próximo passo. Evite jargões técnicos.`;
      break;

    case 'empatico':
      toneGuidance = 'Reconheça o impacto no passageiro, explique a situação e apresente opções claras.';
      systemPromptAddendum = `[MODO EMPÁTICO] Reconheça o impacto da situação no passageiro. Explique com clareza e apresente TODAS as opções disponíveis. Nunca minimize o problema.`;
      break;

    case 'resolucao':
      toneGuidance = 'Confirme elegibilidade, apresente opções e peça autorização antes de executar qualquer ação.';
      systemPromptAddendum = `[MODO RESOLUÇÃO] Confirme elegibilidade, apresente opções claras com valores e prazos, e SEMPRE peça autorização explícita antes de executar qualquer ação.`;
      break;

    case 'seguranca':
      toneGuidance = 'Não revele dados. Solicite validação adicional ou encaminhe para humano.';
      systemPromptAddendum = `[MODO SEGURANÇA] NÃO revele dados sensíveis. Solicite validação adicional de identidade. Se a inconsistência persistir, encaminhe para atendente humano.`;
      break;
  }

  // Adjust for conversation signals (SAFE: based on observed behavior, not demographics)
  if (signals.detected_confusion || signals.asked_to_repeat) {
    systemPromptAddendum += `\n[SINAL: CONFUSÃO DETECTADA] Use linguagem mais pausada e objetiva. Evite jargões. Use frases curtas. Confirme entendimento antes de avançar.`;
  }

  if (signals.detected_frustration) {
    systemPromptAddendum += `\n[SINAL: FRUSTRAÇÃO DETECTADA] Reconheça o sentimento do passageiro. Demonstre que você está agindo para resolver. Seja proativo nas soluções.`;
  }

  if (signals.detected_anxiety) {
    systemPromptAddendum += `\n[SINAL: ANSIEDADE DETECTADA] Transmita segurança. Seja claro sobre prazos e próximos passos. Evite ambiguidade.`;
  }

  if (signals.urgency_level === 'critical' || signals.urgency_level === 'high') {
    systemPromptAddendum += `\n[SINAL: URGÊNCIA ${signals.urgency_level?.toUpperCase()}] Priorize ação imediata. Vá direto ao ponto. Minimize etapas intermediárias.`;
  }

  // Adjust for declared preferences (SAFE: explicitly chosen by customer)
  if (preferences.communication_style === 'detailed') {
    systemPromptAddendum += `\n[PREFERÊNCIA: DETALHADO] O cliente preferiu explicações detalhadas. Inclua mais contexto e justificativas.`;
  }

  if (preferences.accessibility_needs_declared) {
    systemPromptAddendum += `\n[ACESSIBILIDADE DECLARADA: ${preferences.accessibility_needs_declared}] Adapte a comunicação conforme a necessidade informada pelo cliente.`;
  }

  return { mode, toneGuidance, systemPromptAddendum };
}

// ---- Detect Conversation Signals from Message Text ----

export function detectConversationSignals(
  messageText: string,
  existingSignals: Partial<ConversationSignals> = {},
): Partial<ConversationSignals> {
  const lower = messageText.toLowerCase();
  const signals: Partial<ConversationSignals> = { ...existingSignals };

  // Confusion: asking to repeat, "não entendi", "como assim"
  if (/não entend|nao entend|como assim|pode repetir|pode explicar|o que (é|significa)|repita|repete|não compreend/i.test(lower)) {
    signals.detected_confusion = true;
    signals.asked_to_repeat = true;
  }

  // Frustration: expletives, "absurdo", "inaceitável", complaints
  if (/absurdo|inaceit[áa]vel|vergonha|descaso|p[ée]ssim|horrível|hor[ií]vel|reclama|denuncia|procon|anac|ouvidoria|processar|advogado|nunca mais/i.test(lower)) {
    signals.detected_frustration = true;
  }

  // Anxiety: "urgente", "preciso agora", time pressure
  if (/urgente|preciso agora|meu voo.*(daqui|logo|minuto)|não (vou|vai) conseguir|perder.*(voo|conex)|vou perder|falta pouco|embarca/i.test(lower)) {
    signals.detected_anxiety = true;
    signals.urgency_level = 'high';
  }

  // Human handoff request
  if (/falar com (uma? )?(?:pessoa|humano|atendente|supervisor|gerente)|atendimento humano/i.test(lower)) {
    signals.requested_human = true;
  }

  return signals;
}

// ---- Anti-Bias Guardrail (injected into every system prompt) ----

export const ANTI_BIAS_GUARDRAIL = `
## GUARDRAIL ANTI-VIÉS (OBRIGATÓRIO)

Adapte a comunicação APENAS com base em:
1. Preferência declarada pelo cliente (idioma, estilo de comunicação)
2. Contexto da jornada (voo atrasado, cancelado, bagagem extraviada)
3. Urgência operacional (passageiro no aeroporto, conexão próxima)
4. Sinais conversacionais observados (confusão, frustração, ansiedade demonstrada na conversa)
5. Necessidades de acessibilidade explicitamente informadas pelo cliente

NUNCA reduza, limite, oculte ou altere direitos, opções, compensações ou prioridade regulatória com base em idade, localização, gênero, renda presumida, sotaque, escolaridade presumida ou qualquer atributo sensível.

Todos os passageiros recebem as mesmas opções para a mesma situação operacional. A linguagem pode mudar — os direitos não.
`.trim();

// ---- Urgency Level Detection (based on OPERATIONAL data) ----

export function detectUrgencyFromOperationalData(context: {
  departureTime?: string;         // ISO timestamp of next departure
  isAtAirport?: boolean;          // declared by customer
  hasActiveConnection?: boolean;  // from PNR data
  boardingStatus?: string;        // 'not_started' | 'boarding' | 'closed'
}): ConversationSignals['urgency_level'] {
  if (context.boardingStatus === 'boarding' || context.boardingStatus === 'closed') {
    return 'critical';
  }

  if (context.departureTime) {
    const minutesToDeparture = (new Date(context.departureTime).getTime() - Date.now()) / 60000;
    if (minutesToDeparture <= 30) return 'critical';
    if (minutesToDeparture <= 90) return 'high';
    if (minutesToDeparture <= 240) return 'medium';
  }

  if (context.isAtAirport || context.hasActiveConnection) {
    return 'high';
  }

  return 'low';
}
