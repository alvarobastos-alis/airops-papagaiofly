export interface KnowledgeDocument {
  id: string;
  topic: string;
  content: string;
  embedding?: number[];
}

export const KNOWLEDGE_BASE: KnowledgeDocument[] = [
  // ========== ANAC Resolução 400 ==========
  {
    id: 'anac_info_imediata',
    topic: 'Informação imediata ao passageiro sobre alterações (ANAC)',
    content: 'De acordo com a Resolução 400 da ANAC, a companhia aérea deve informar imediatamente o passageiro sobre qualquer atraso, cancelamento, interrupção ou alteração no voo, inclusive quanto à previsão de novo horário de partida.',
  },
  {
    id: 'anac_atraso_1h',
    topic: 'Direitos em caso de atraso superior a 1 hora (ANAC)',
    content: 'Resolução 400 ANAC: Atraso acima de 1 hora — a companhia aérea é obrigada a fornecer meios de comunicação gratuitos (internet, telefone) para o passageiro informar terceiros sobre a situação.',
  },
  {
    id: 'anac_atraso_2h',
    topic: 'Direitos em caso de atraso de voo superior a 2 horas (ANAC)',
    content: 'Resolução 400 ANAC: Atraso acima de 2 horas — além de comunicação, a companhia deve fornecer alimentação adequada (voucher, lanche, bebidas ou refeição) proporcional ao tempo de espera e horário do dia.',
  },
  {
    id: 'anac_atraso_4h',
    topic: 'Direitos em caso de atraso superior a 4 horas ou cancelamento (ANAC)',
    content: 'Resolução 400 ANAC: Atraso acima de 4 horas, cancelamento ou preterição de embarque — a companhia deve oferecer ao passageiro três opções: 1) Reacomodação em voo próprio ou de outra companhia sem custos. 2) Remarcação para data e horário de conveniência do passageiro sem custos. 3) Reembolso integral incluindo taxas. Se o passageiro optar por aguardar e houver necessidade de pernoite, a empresa deve fornecer hospedagem e transporte de ida e volta ao aeroporto.',
  },
  {
    id: 'anac_cancelamento',
    topic: 'Direitos do passageiro em caso de cancelamento de voo (ANAC)',
    content: 'Resolução 400 ANAC — Cancelamento: O passageiro tem direito a escolher entre reacomodação no próximo voo disponível (próprio ou de outra companhia), remarcação para data/horário sem custos, ou reembolso integral. Assistência material completa (comunicação, alimentação, hospedagem se necessário) deve ser fornecida enquanto o passageiro aguardar. A companhia deve informar o motivo do cancelamento.',
  },
  {
    id: 'anac_overbooking',
    topic: 'Preterição de embarque / Overbooking (ANAC)',
    content: 'Resolução 400 ANAC — Preterição (Overbooking): Quando há excesso de passageiros, a companhia deve primeiro buscar voluntários oferecendo compensação negociada. Se involuntário, o passageiro preterido tem direito a: reacomodação, remarcação ou reembolso integral + compensação financeira imediata (250 DES para voos domésticos ≈ R$1.500, ou 500 DES para internacionais ≈ R$3.000) + assistência material completa. Downgrade de classe dá direito a reembolso da diferença.',
  },
  {
    id: 'anac_bagagem_domestico',
    topic: 'Bagagem extraviada em voo doméstico — prazo e direitos (ANAC)',
    content: 'ANAC — Bagagem doméstica: A companhia tem prazo máximo de 7 dias para localizar e devolver bagagem extraviada em voos domésticos. Após 7 dias, a bagagem é considerada perdida e o passageiro tem direito a indenização. Enquanto aguarda, o passageiro tem direito a reembolso de itens de primeira necessidade.',
  },
  {
    id: 'anac_bagagem_internacional',
    topic: 'Bagagem extraviada em voo internacional — prazo e direitos (ANAC)',
    content: 'ANAC — Bagagem internacional: O prazo para localização é de 21 dias para voos internacionais. Se ultrapassado, é considerada perdida com direito a indenização integral. O passageiro deve registrar PIR (Property Irregularity Report) no ato e recebe protocolo para acompanhamento.',
  },
  {
    id: 'anac_bagagem_danificada',
    topic: 'Bagagem danificada — direitos (ANAC)',
    content: 'ANAC — Bagagem danificada: O passageiro deve registrar a avaria no ato do recebimento, preenchendo PIR. A companhia pode optar por reparo ou indenização. O prazo para reclamação é de 7 dias após o recebimento (doméstico) ou 7 dias (internacional, Convenção de Montreal).',
  },
  // ========== Políticas Tarifárias ==========
  {
    id: 'policy_tarifa_light',
    topic: 'Política da Tarifa Light (AirOps)',
    content: 'Tarifa LIGHT da AirOps: NÃO é reembolsável. NÃO permite alteração. NÃO inclui despacho de bagagem (apenas bagagem de mão de 10kg). Em cancelamento voluntário, multa retém 100% do valor da tarifa (apenas taxas de embarque devolvidas). NÃO gera crédito ou voucher. IMPORTANTE: Em caso de IROP (cancelamento/atraso >4h pela companhia), a regra ANAC prevalece e o passageiro TEM direito a reembolso integral independente da tarifa.',
  },
  {
    id: 'policy_tarifa_plus',
    topic: 'Política da Tarifa Plus (AirOps)',
    content: 'Tarifa PLUS da AirOps: NÃO é reembolsável voluntariamente. Permite alteração com taxa de R$150 + diferença tarifária. Inclui 1 mala de 23kg despachada. Em cancelamento voluntário: multa de R$250 — saldo pode ser convertido em crédito de voo. Permite emissão de voucher/crédito.',
  },
  {
    id: 'policy_tarifa_max',
    topic: 'Política da Tarifa MAX (AirOps)',
    content: 'Tarifa MAX da AirOps: É reembolsável com taxa de R$50. Permite alteração sem custo. Inclui 2 malas de 23kg. Em cancelamento voluntário: retenção de R$50 — restante reembolsado em até 7 dias úteis. Crédito de voo pode ser emitido a qualquer momento.',
  },
  {
    id: 'policy_tarifa_flex',
    topic: 'Política da Tarifa FLEX Business (AirOps)',
    content: 'Tarifa FLEX (Business) da AirOps: Reembolso integral sem taxa. Alteração ilimitada sem custo. Inclui 2 malas de 32kg. Assento premium com embarque prioritário. Sala VIP inclusa. No-show: taxa de R$100. É a tarifa com maior flexibilidade.',
  },
  // ========== Bagagem ==========
  {
    id: 'policy_bagagem_mao',
    topic: 'Política de bagagem de mão (AirOps)',
    content: 'AirOps permite 1 bagagem de mão de até 10kg e dimensões máximas de 55x35x25cm em todas as tarifas. Itens pessoais (bolsa, laptop, carteira) não contam. Bagagens acima do limite devem ser despachadas no balcão mediante pagamento de taxa de excesso.',
  },
  {
    id: 'policy_bagagem_excesso',
    topic: 'Taxa de excesso de bagagem (AirOps)',
    content: 'AirOps cobra taxa de excesso de bagagem: R$80 por mala adicional (até 23kg) em voos domésticos, R$150 em internacionais. Mala acima de 23kg até 32kg: taxa adicional de R$120. Acima de 32kg: não aceito como bagagem despachada, apenas como carga.',
  },
  // ========== PETC e UMNR ==========
  {
    id: 'policy_petc',
    topic: 'Animais de estimação na cabine — PETC (AirOps)',
    content: 'AirOps permite cães e gatos na cabine (PETC) sob regras: peso máximo animal + caixa de transporte = 8kg total. Custo fixo de R$250 por trecho. Raças braquicefálicas requerem autorização veterinária 5 dias antes. Deve ser solicitado via telefone com mínimo 48h de antecedência. Máximo 2 PETCs por voo.',
  },
  {
    id: 'policy_umnr',
    topic: 'Menores desacompanhados — UMNR (AirOps)',
    content: 'AirOps aceita menores desacompanhados (UMNR) de 8 a 15 anos completos. Taxa de acompanhamento: R$200 por trecho. Requer Autorização Judicial (original) e identificação do adulto receptor no destino. Embarque e desembarque são assistidos por funcionários. Solicitação presencial obrigatória no balcão.',
  },
  // ========== Reembolso ==========
  {
    id: 'policy_reembolso_prazos',
    topic: 'Prazos de reembolso (AirOps)',
    content: 'AirOps processa reembolsos nos seguintes prazos: Cartão de crédito: até 2 faturas subsequentes. PIX: até 7 dias úteis. Boleto/transferência: até 30 dias úteis. Reembolsos involuntários (IROP) são priorizados e processados em até 5 dias úteis.',
  },
  {
    id: 'policy_credito_voo',
    topic: 'Crédito de voo / Voucher (AirOps)',
    content: 'Crédito de voo AirOps: Validade de 12 meses a partir da emissão. Pode ser usado em qualquer voo AirOps para o mesmo passageiro. Diferenças tarifárias são cobradas. Se o valor do novo voo for menor, o saldo permanece como crédito. Não é transferível para terceiros. Não tem valor em dinheiro.',
  },
  // ========== Compensação ==========
  {
    id: 'policy_voucher_alimentacao',
    topic: 'Voucher de alimentação por atraso (AirOps)',
    content: 'AirOps emite voucher de alimentação nos seguintes valores: Atraso >2h em voo doméstico: R$30. Atraso >2h em voo internacional: R$50. Cancelamento com espera >2h: mesmo valor. Válido para uso no aeroporto no dia do atraso.',
  },
  {
    id: 'policy_hospedagem',
    topic: 'Hospedagem e transporte por atraso/cancelamento (AirOps)',
    content: 'AirOps fornece hospedagem quando há pernoite por atraso >4h ou cancelamento: Hotel conveniado próximo ao aeroporto + transporte ida e volta. Para passageiros locais (moradia na cidade), transporte residência ↔ aeroporto.',
  },
  // ========== Operacional ==========
  {
    id: 'policy_checkin',
    topic: 'Check-in online e presencial (AirOps)',
    content: 'AirOps: Check-in online abre 48h antes e fecha 1h antes da partida (doméstico) ou 2h (internacional). Check-in no balcão: abre 3h antes e fecha 45min antes. Embarque inicia 40min antes da partida. Portão fecha 15min antes.',
  },
  {
    id: 'policy_documentos',
    topic: 'Documentação necessária para embarque (AirOps)',
    content: 'AirOps exige: Voos domésticos — documento oficial com foto (RG, CNH, passaporte). Menores de 12 anos: certidão de nascimento acompanhados, ou Autorização Judicial se desacompanhados. Voos internacionais — passaporte válido + visto quando exigido pelo destino.',
  },
  // ========== LGPD ==========
  {
    id: 'policy_lgpd',
    topic: 'Política de privacidade e LGPD (AirOps)',
    content: 'AirOps segue a LGPD: dados pessoais de passageiros são tratados exclusivamente para operação do voo e atendimento. O agente IA NÃO armazena dados pessoais além da sessão. Dados como CPF, telefone e email são mascarados no log. O passageiro pode solicitar exclusão de dados a qualquer momento.',
  },
  {
    id: 'policy_gravacao',
    topic: 'Gravação de atendimento (AirOps)',
    content: 'AirOps: Todas as interações por chat e voz podem ser gravadas para fins de qualidade e treinamento. O passageiro é informado no início da interação. As gravações são mantidas por 90 dias e depois excluídas automaticamente.',
  },
];
