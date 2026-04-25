// ==========================================
// AirOps AI — Conversation Engine Hook
// Rule-based intent classification + response
// ==========================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ThinkingStep, AgentAction, Intent } from '../types/agent';
import type { PNR } from '../types/airline';
import { mockPNRs, mockBaggage, mockIROPs } from '../data/mockData';
import { evaluateDelayRules, evaluateCancellationRules, evaluateDeniedBoardingRules, evaluateBaggageRules } from '../data/anacRules';

import { api } from '../services/api';

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Intent classification based on keywords
function classifyIntent(text: string): Intent {
  const lower = text.toLowerCase();
  if (/status|como.?est[áa]|hor[áa]rio|port[ãa]o|gate|terminal|atraso do (meu )?voo/i.test(lower)) return 'flight-status';
  if (/remarc|alter|mudar|trocar.*(data|voo|hor)/i.test(lower)) return 'change-flight';
  if (/cancel/i.test(lower)) return 'cancel-flight';
  if (/reembols|refund|devol|estorn/i.test(lower)) return 'request-refund';
  if (/bag|mala|mochila|extravi|perdi.*(bag|mala)|dano/i.test(lower)) return 'resolve-baggage';
  if (/conex|perdi.*(voo|conex)|transfer/i.test(lower)) return 'lost-connection';
  if (/overbooking|n[ãa]o.*embarca|impedid|preterid|negat/i.test(lower)) return 'denied-boarding';
  if (/assist[eê]ncia|ajuda|hotel|aliment|voucher|comida/i.test(lower)) return 'request-assistance';
  if (/check.?in|embarque|cart[ãa]o/i.test(lower)) return 'check-in-help';
  if (/milha|fidelidade|status|premium|gold|diamond|platin/i.test(lower)) return 'loyalty-inquiry';
  return 'general-inquiry';
}

// Extract PNR from message
function extractPNR(text: string): string | null {
  const match = text.match(/\b([A-Z]{3}\d{3}|[A-Z0-9]{6})\b/i);
  return match ? match[1].toUpperCase() : null;
}



// Look up PNR — first in client mock data, then assume API will handle it
function lookupPNR(locator: string): PNR | undefined {
  const local = mockPNRs.find(p => p.locator === locator);
  if (local) return local;
  // For server-only PNRs, create a minimal stub so identified=true
  // The actual response will come from the backend API
  if (locator.length >= 5) {
    return {
      locator,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      passengers: [{ id: 'api', firstName: 'Passageiro', lastName: '', documentType: 'cpf', documentNumber: '' }],
      segments: [],
      tickets: [],
      contact: { email: '', phone: '' },
    } as any;
  }
  return undefined;
}

// Build thinking steps for different intents
function buildThinkingSteps(intent: Intent): ThinkingStep[] {
  const base: ThinkingStep[] = [
    { id: 'ts-1', label: 'Identificando passageiro...', status: 'done' },
    { id: 'ts-2', label: 'Consultando PSS/Reservas...', status: 'done' },
  ];

  switch (intent) {
    case 'flight-status':
      return [...base,
        { id: 'ts-3', label: 'Consultando status do voo...', status: 'done' },
        { id: 'ts-4', label: 'Verificando eventos...', status: 'done' },
      ];
    case 'change-flight':
      return [...base,
        { id: 'ts-3', label: 'Verificando regras tarifárias...', status: 'done' },
        { id: 'ts-4', label: 'Consultando inventário...', status: 'done' },
        { id: 'ts-5', label: 'Calculando diferença...', status: 'done' },
      ];
    case 'cancel-flight':
      return [...base,
        { id: 'ts-3', label: 'Verificando regras tarifárias...', status: 'done' },
        { id: 'ts-4', label: 'Calculando multa/crédito...', status: 'done' },
        { id: 'ts-5', label: 'Preparando opções...', status: 'done' },
      ];
    case 'request-refund':
      return [...base,
        { id: 'ts-3', label: 'Consultando status do reembolso...', status: 'done' },
      ];
    case 'resolve-baggage':
      return [...base,
        { id: 'ts-3', label: 'Consultando sistema de bagagem...', status: 'done' },
        { id: 'ts-4', label: 'Verificando regras ANAC...', status: 'done' },
      ];
    case 'lost-connection':
      return [...base,
        { id: 'ts-3', label: 'Verificando trecho anterior...', status: 'done' },
        { id: 'ts-4', label: 'Consultando alternativas...', status: 'done' },
        { id: 'ts-5', label: 'Aplicando regras ANAC...', status: 'done' },
        { id: 'ts-6', label: 'Preparando reproteção...', status: 'done' },
      ];
    case 'denied-boarding':
      return [...base,
        { id: 'ts-3', label: 'Confirmando preterição no DCS...', status: 'done' },
        { id: 'ts-4', label: 'Aplicando regras ANAC...', status: 'done' },
        { id: 'ts-5', label: 'Calculando compensação...', status: 'done' },
        { id: 'ts-6', label: 'Buscando voos alternativos...', status: 'done' },
      ];
    default:
      return [...base,
        { id: 'ts-3', label: 'Analisando solicitação...', status: 'done' },
      ];
  }
}

// Generate agent response based on intent and PNR
function generateResponse(intent: Intent, pnr: PNR | undefined): { content: string; actions: AgentAction[] } {
  if (!pnr) {
    return {
      content: 'Não encontrei a reserva com esse localizador. Pode confirmar o PNR (código de 6 caracteres) e o sobrenome do passageiro?',
      actions: [],
    };
  }

  const passenger = pnr.passengers[0];
  const segment = pnr.segments[0];
  const ticket = pnr.tickets[0];

  switch (intent) {
    case 'flight-status': {
      if (segment.status === 'delayed' && segment.delayMinutes) {
        const rules = evaluateDelayRules(segment.delayMinutes);
        const actions: AgentAction[] = [];
        
        if (rules.rights.reaccommodation) {
          actions.push({
            type: 'reaccommodation',
            title: 'Reacomodação',
            description: `Próximo voo disponível: AO${1000 + Math.floor(Math.random() * 9000)}`,
            details: { 'Horário': '16:30', 'Rota': `${segment.origin.code} → ${segment.destination.code}` },
            selectable: true,
          });
        }
        if (rules.rights.reschedule) {
          actions.push({
            type: 'reschedule',
            title: 'Remarcação',
            description: 'Escolher nova data/horário de conveniência',
            selectable: true,
          });
        }
        if (rules.rights.refund) {
          actions.push({
            type: 'refund',
            title: 'Reembolso Integral',
            description: `Valor: R$ ${ticket.amount.toFixed(2)}`,
            selectable: true,
          });
        }
        if (rules.rights.assistanceMaterial.food) {
          actions.push({
            type: 'voucher',
            title: '📱 Voucher iFood',
            description: 'Receba um voucher digital no iFood para pedir sua refeição diretamente pelo app, sem sair do lugar',
            details: { 'Valor': 'R$ 50,00', 'Validade': 'Hoje', 'Plataforma': 'iFood' },
            selectable: true,
          });
          actions.push({
            type: 'info',
            title: '🍽️ Restaurantes Credenciados',
            description: 'Dirija-se ao balcão da Papagaio Fly no aeroporto para consultar os restaurantes credenciados e retirar seu voucher físico',
            details: { 'Local': 'Balcão Papagaio Fly', 'Valor': 'R$ 50,00' },
            selectable: false,
          });
        }

        return {
          content: `Olá, ${passenger.firstName}! Encontrei seu voo **${segment.flightNumber}** (${segment.origin.code} → ${segment.destination.code}).\n\n⚠️ Ele está com **atraso de ${segment.delayMinutes} minutos** por: *${segment.delayReason}*.\n\n${rules.details.join('\n')}\n\n${segment.delayMinutes >= 240 ? 'Você pode escolher entre as opções abaixo:' : 'Vou te manter atualizado sobre novas informações.'}`,
          actions,
        };
      }

      if (segment.status === 'cancelled') {
        const rules = evaluateCancellationRules();
        return {
          content: `Olá, ${passenger.firstName}. Seu voo **${segment.flightNumber}** (${segment.origin.code} → ${segment.destination.code}) foi **cancelado** por: *${segment.delayReason || 'motivo operacional'}*.\n\n${rules.details.join('\n')}\n\nVeja as opções disponíveis:`,
          actions: [
            {
              type: 'reaccommodation',
              title: '✈️ Reacomodação Imediata',
              description: `Próximo voo: AO3458 às 17:30 (${segment.origin.code} → ${segment.destination.code})`,
              details: { 'Classe': segment.fareClass, 'Sem custo adicional': 'Sim' },
              selectable: true,
            },
            {
              type: 'reschedule',
              title: '📅 Remarcação',
              description: 'Escolher outra data/horário sem custo',
              selectable: true,
            },
            {
              type: 'credit',
              title: '💳 Crédito de Voo',
              description: `Crédito de R$ ${ticket.amount.toFixed(2)} válido por 18 meses`,
              selectable: true,
            },
            {
              type: 'refund',
              title: '💰 Reembolso Integral',
              description: `R$ ${ticket.amount.toFixed(2)} — prazo de 7 dias úteis`,
              selectable: true,
            },
          ],
        };
      }

      return {
        content: `Olá, ${passenger.firstName}! Seu voo **${segment.flightNumber}** de ${segment.origin.city} (${segment.origin.code}) para ${segment.destination.city} (${segment.destination.code}) está **${segment.status === 'on-time' ? 'confirmado e no horário' : segment.status}**.\n\n🕐 Partida: ${new Date(segment.scheduledDeparture).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n${segment.gate ? `🚪 Portão: ${segment.gate}` : ''}\n${segment.terminal ? `🏢 Terminal: ${segment.terminal}` : ''}\n✈️ Aeronave: ${segment.aircraft || 'N/A'}\n💺 Assento: ${segment.seatNumber || 'Não alocado'}`,
        actions: [],
      };
    }

    case 'cancel-flight': {
      const fareRules = ticket.fareRules;
      if (fareRules.refundable) {
        return {
          content: `${passenger.firstName}, sua tarifa **${ticket.fareBasis}** permite cancelamento com reembolso integral.\n\nAntes do reembolso, gostaria de considerar um **crédito de voo**? Ele tem validade de 18 meses e pode ser usado em qualquer rota.`,
          actions: [
            {
              type: 'credit',
              title: '💳 Crédito de Voo',
              description: `R$ ${ticket.amount.toFixed(2)} válidos por 18 meses`,
              selectable: true,
            },
            {
              type: 'refund',
              title: '💰 Reembolso Integral',
              description: `R$ ${ticket.amount.toFixed(2)} — processamento em 7 dias úteis`,
              selectable: true,
            },
          ],
        };
      } else {
        const creditValue = ticket.amount - fareRules.cancelFee;
        return {
          content: `${passenger.firstName}, sua tarifa **${ticket.fareBasis}** tem uma multa de cancelamento de **R$ ${fareRules.cancelFee.toFixed(2)}**.\n\nPosso gerar um **crédito de voo** no valor residual:`,
          actions: [
            {
              type: 'credit',
              title: '💳 Crédito de Voo',
              description: `R$ ${creditValue.toFixed(2)} (valor pago - multa) válidos por 18 meses`,
              selectable: true,
            },
            {
              type: 'info',
              title: 'ℹ️ Detalhes da Tarifa',
              description: `Valor pago: R$ ${ticket.amount.toFixed(2)} | Multa: R$ ${fareRules.cancelFee.toFixed(2)} | Crédito: R$ ${creditValue.toFixed(2)}`,
            },
          ],
        };
      }
    }

    case 'change-flight': {
      const fareRules = ticket.fareRules;
      return {
        content: `${passenger.firstName}, posso te ajudar com a remarcação do voo **${segment.flightNumber}**.\n\nSua tarifa **${ticket.fareBasis}** ${fareRules.changeAllowed ? 'permite' : 'não permite'} alteração${fareRules.changeFee > 0 ? ` com taxa de R$ ${fareRules.changeFee.toFixed(2)}` : ' sem taxa'}.\n\nAqui estão as próximas opções disponíveis:`,
        actions: [
          {
            type: 'reschedule',
            title: '✈️ Amanhã 08:30',
            description: `AO${segment.flightNumber.slice(2)} — ${segment.origin.code} → ${segment.destination.code}`,
            details: { 'Taxa': fareRules.changeFee > 0 ? `R$ ${fareRules.changeFee.toFixed(2)}` : 'Gratuita', 'Diferença': 'R$ 0,00' },
            selectable: true,
          },
          {
            type: 'reschedule',
            title: '✈️ Amanhã 14:15',
            description: `AO${parseInt(segment.flightNumber.slice(2)) + 2} — ${segment.origin.code} → ${segment.destination.code}`,
            details: { 'Taxa': fareRules.changeFee > 0 ? `R$ ${fareRules.changeFee.toFixed(2)}` : 'Gratuita', 'Diferença': 'R$ 45,00' },
            selectable: true,
          },
          {
            type: 'reschedule',
            title: '✈️ Amanhã 19:40',
            description: `AO${parseInt(segment.flightNumber.slice(2)) + 4} — ${segment.origin.code} → ${segment.destination.code}`,
            details: { 'Taxa': fareRules.changeFee > 0 ? `R$ ${fareRules.changeFee.toFixed(2)}` : 'Gratuita', 'Diferença': 'R$ -30,00' },
            selectable: true,
          },
        ],
      };
    }

    case 'resolve-baggage': {
      const bag = mockBaggage[0];
      const rules = evaluateBaggageRules(true, bag.daysMissing || 0);
      return {
        content: `${passenger.firstName}, vou verificar o status da sua bagagem.\n\n🧳 **Tag:** ${bag.tagNumber}\n📍 **Última localização:** ${bag.lastLocation}\n📋 **Status:** ${bag.status === 'missing' ? 'Em busca' : bag.status}\n📅 **Dias:** ${bag.daysMissing || 0} de ${rules.deadlineDays} (prazo legal)\n\n${rules.details.join('\n')}\n\nEstou registrando a ocorrência e você receberá atualizações.`,
        actions: [
          {
            type: 'baggage-report',
            title: '📋 Protocolo PIR',
            description: `PIR: ${bag.pirNumber} — Acompanhe pelo app ou ligue para atualizações`,
            details: { 'Protocolo': bag.pirNumber || 'N/A', 'Previsão': '24-48h para atualização' },
          },
          {
            type: 'voucher',
            title: '💳 Itens de Emergência',
            description: 'Voucher para itens de primeira necessidade',
            details: { 'Valor': 'R$ 200,00', 'Validade': '72 horas' },
            selectable: true,
          },
        ],
      };
    }

    case 'lost-connection': {
      return {
        content: `${passenger.firstName}, entendo que você perdeu a conexão. Estou verificando as alternativas.\n\nComo se trata de responsabilidade da companhia, você tem direito a **reacomodação imediata** e assistência material.\n\nAqui estão as opções:`,
        actions: [
          {
            type: 'reaccommodation',
            title: '✈️ Próximo Voo Disponível',
            description: `AO${2000 + Math.floor(Math.random() * 8000)} — Saída em 2h30`,
            details: { 'Portão': 'B08', 'Classe': 'Econômica' },
            selectable: true,
          },
          {
            type: 'voucher',
            title: '📱 Voucher iFood',
            description: 'Voucher digital no iFood — peça sua refeição pelo app enquanto aguarda',
            details: { 'Valor': 'R$ 50,00', 'Plataforma': 'iFood' },
            selectable: true,
          },
          {
            type: 'info',
            title: '🍽️ Restaurantes Credenciados',
            description: 'Procure o balcão da Papagaio Fly para ver os restaurantes credenciados e retirar voucher físico',
            details: { 'Local': 'Balcão Papagaio Fly' },
          },
          {
            type: 'reaccommodation',
            title: '✈️ Voo Amanhã 07:00',
            description: `AO${2000 + Math.floor(Math.random() * 8000)} — Com hospedagem incluída`,
            details: { 'Hotel': 'Próximo ao aeroporto', 'Transporte': 'Incluído' },
            selectable: true,
          },
        ],
      };
    }

    case 'denied-boarding': {
      const rules = evaluateDeniedBoardingRules();
      return {
        content: `${passenger.firstName}, lamento muito pela situação. Confirmei no sistema que houve **preterição** no seu embarque.\n\n${rules.details.join('\n')}\n\nVou resolver isso agora:`,
        actions: [
          {
            type: 'reaccommodation',
            title: '✈️ Reacomodação Imediata',
            description: 'Próximo voo disponível com assento confirmado',
            selectable: true,
          },
          {
            type: 'voucher',
            title: '💰 Compensação Financeira',
            description: 'Compensação por preterição conforme regulação',
            details: { 'Valor': 'R$ 1.200,00', 'Forma': 'Crédito ou PIX' },
            selectable: true,
          },
          {
            type: 'voucher',
            title: '🍽️ Assistência Material',
            description: 'Alimentação + hotel + transporte (se necessário)',
          },
        ],
      };
    }

    case 'request-refund': {
      return {
        content: `${passenger.firstName}, consultei o sistema de reembolsos para o bilhete **${ticket.eTicket}**.\n\n📋 **Status:** Em processamento\n💰 **Valor:** R$ ${ticket.amount.toFixed(2)}\n📅 **Prazo estimado:** 7 dias úteis\n🏦 **Método:** Estorno no cartão de crédito original\n\nVocê receberá um e-mail assim que o reembolso for concluído.`,
        actions: [
          {
            type: 'info',
            title: 'ℹ️ Acompanhamento',
            description: 'Você pode verificar o status no app ou ligando novamente',
          },
        ],
      };
    }

    case 'request-assistance': {
      const irop = mockIROPs.find(i => i.flightNumber === segment.flightNumber);
      if (irop) {
        const rules = evaluateDelayRules(irop.delayMinutes || 240);
        return {
          content: `${passenger.firstName}, seu voo **${segment.flightNumber}** está em situação irregular (${irop.type === 'delay' ? `atraso de ${irop.delayMinutes}min` : 'cancelado'}).\n\nConforme a regulação, estes são seus direitos neste momento:\n\n${rules.details.join('\n')}`,
          actions: rules.rights.assistanceMaterial.food ? [
            {
              type: 'voucher',
              title: '📱 Voucher iFood',
              description: 'Receba um voucher digital no iFood — peça sua refeição pelo app sem sair do lugar',
              details: { 'Valor': 'R$ 50,00', 'Plataforma': 'iFood' },
              selectable: true,
            },
            {
              type: 'info',
              title: '🍽️ Restaurantes Credenciados',
              description: 'Dirija-se ao balcão da Papagaio Fly para consultar restaurantes credenciados e retirar voucher físico',
              details: { 'Local': 'Balcão Papagaio Fly', 'Valor': 'R$ 50,00' },
              selectable: false,
            },
          ] : [],
        };
      }
      return {
        content: `${passenger.firstName}, estou verificando sua situação para fornecer a assistência adequada. No momento seu voo está ${segment.status}. Como posso ajudar especificamente?`,
        actions: [],
      };
    }

    default:
      return {
        content: `Olá, ${passenger.firstName}! Sou a Zulu, da Papagaio Fly! Posso ajudar com:\n\n• 📋 Status do voo\n• ✈️ Remarcação ou cancelamento\n• 💰 Reembolsos\n• 🧳 Bagagem\n• 🔄 Conexões perdidas\n• ⚡ Assistência em atrasos/cancelamentos\n\nComo posso ajudar?`,
        actions: [],
      };
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getZuluOpening() {
  const greetings = [
    `${getGreeting()}! Aqui é a Zulu, da Papagaio Fly! Espero que esteja tudo bem com você 😊`,
    `${getGreeting()}! Eu sou a Zulu, sua assistente da Papagaio Fly! Que bom ter você aqui!`,
    `Oi! ${getGreeting()}! Aqui é a Zulu da Papagaio Fly! Estou pronta pra te ajudar!`,
    `${getGreeting()}! Seja muito bem-vindo(a)! Sou a Zulu, da Papagaio Fly. Fico feliz em te atender!`,
    `${getGreeting()}! Aqui quem fala é a Zulu, da Papagaio Fly! Tô aqui pra resolver o que precisar!`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export interface ConversationState {
  messages: ChatMessage[];
  isThinking: boolean;
  currentPNR: PNR | null;
  currentIntent: Intent | null;
  identified: boolean;
  step: number;
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    messages: [
      {
        id: generateId(),
        role: 'agent',
        content: `${getZuluOpening()} Para começar, por favor, me informe o seu **código de reserva (PNR)**.`,
        timestamp: now(),
      },
    ],
    isThinking: false,
    currentPNR: null,
    currentIntent: null,
    identified: false,
    step: 0,
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sendMessage = useCallback((text: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: now(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isThinking: true,
    }));

    // Simulate agent processing
    const thinkTime = 1500 + Math.random() * 1500;

    timerRef.current = setTimeout(() => {
      let { currentPNR: pnr, identified, step } = stateRef.current;

      // Try to extract PNR from message, allowing it to override existing one if user changes context
      const pnrCode = extractPNR(text);
      if (pnrCode) {
        const newPnr = lookupPNR(pnrCode);
        if (newPnr) {
          pnr = newPnr;
          identified = true;
        }
      }
      
      // Step 0: Waiting for PNR
      if (step === 0) {
        if (!identified) {
          const agentReply: ChatMessage = {
            id: generateId(),
            role: 'agent',
            content: 'Não consegui identificar um código de reserva válido. Se der algum erro ou se não tiver o código de reserva, por favor entre em contato no número **9999-9999**.',
            timestamp: now(),
          };
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, agentReply],
            isThinking: false,
          }));
          return;
        } else {
          const agentReply: ChatMessage = {
            id: generateId(),
            role: 'agent',
            content: 'Perfeito, localizei a reserva. Agora, por favor, me informe o **sobrenome do passageiro** exatamente como está na passagem.',
            timestamp: now(),
          };
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, agentReply],
            isThinking: false,
            currentPNR: pnr,
            identified: true,
            step: 1,
          }));
          return;
        }
      }

      // Step 1: Waiting for Name
      if (step === 1) {
        step = 2; // Proceed to backend with the name
      }

      // Classify intent locally for actions
      const intent = classifyIntent(text);
      const thinkSteps = buildThinkingSteps(intent);
      const { actions } = generateResponse(intent, pnr || undefined);

      // Set thinking state before API call
      setState(prev => ({ ...prev, isThinking: true }));

      // Call the real backend API for response and security pipeline
      api.sendMessage(text, undefined, pnr?.locator)
        .then((apiResponse) => {
          const agentReply: ChatMessage = {
            id: generateId(),
            role: 'agent',
            content: apiResponse.response,
            timestamp: now(),
            actions: actions.length > 0 ? actions : undefined,
            thinkingSteps: thinkSteps,
            securityPipeline: apiResponse.security,
          };

          setState(currentState => ({
            ...currentState,
            messages: [...currentState.messages, agentReply],
            isThinking: false,
            currentPNR: pnr,
            currentIntent: intent,
            identified,
            step,
          }));
        })
          .catch((err) => {
            console.error('API Error:', err);
            const errorReply: ChatMessage = {
              id: generateId(),
              role: 'agent',
              content: 'Desculpe, houve um erro ao conectar com o servidor.',
              timestamp: now(),
            };
            setState(currentState => ({
              ...currentState,
              messages: [...currentState.messages, errorReply],
              isThinking: false,
            }));
          });
    }, thinkTime);
  }, []);

  const selectAction = useCallback((action: AgentAction) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: `Quero: ${action.title}`,
      timestamp: now(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isThinking: true,
    }));

    setTimeout(() => {
      setState(prev => {
        const passenger = prev.currentPNR?.passengers[0];
        let response = '';

        switch (action.type) {
          case 'reaccommodation':
            response = `✅ Pronto, ${passenger?.firstName}! Sua reacomodação foi confirmada.\n\n${action.description}\n\nSeu novo cartão de embarque será enviado por e-mail e estará disponível no app. Boa viagem! ✈️`;
            break;
          case 'reschedule':
            response = `✅ Remarcação confirmada, ${passenger?.firstName}!\n\n${action.description}\n\nO novo bilhete eletrônico e o cartão de embarque serão enviados para seu e-mail. Posso ajudar com mais alguma coisa?`;
            break;
          case 'credit':
            response = `✅ Crédito de voo gerado com sucesso, ${passenger?.firstName}!\n\n${action.description}\n\nO código do voucher será enviado por e-mail. Você pode usá-lo em qualquer reserva pelo site, app ou central de atendimento.`;
            break;
          case 'refund':
            response = `✅ Reembolso solicitado com sucesso, ${passenger?.firstName}!\n\n${action.description}\n\nO prazo para processamento é de até 7 dias úteis. Você receberá um e-mail de confirmação. Posso ajudar com mais alguma coisa?`;
            break;
          case 'voucher':
            response = `✅ Voucher iFood emitido com sucesso, ${passenger?.firstName}!\n\n🎫 **Código:** PPFLY-${Math.random().toString(36).slice(2, 8).toUpperCase()}\n💰 **Valor:** R$ 50,00\n📱 **Como usar:** Abra o app iFood, vá em "Cupons" e insira o código acima. O voucher é válido para qualquer restaurante disponível na plataforma.\n\nAlternativamente, você pode se dirigir ao **balcão da Papagaio Fly** no aeroporto para consultar os restaurantes credenciados e retirar um voucher físico.\n\nBom apetite! 🍽️`;
            break;
          default:
            response = `✅ Ação processada com sucesso, ${passenger?.firstName}! Posso ajudar com mais alguma coisa?`;
        }

        const agentReply: ChatMessage = {
          id: generateId(),
          role: 'agent',
          content: response,
          timestamp: now(),
        };

        return {
          ...prev,
          messages: [...prev.messages, agentReply],
          isThinking: false,
        };
      });
    }, 1200);
  }, []);

  return {
    messages: state.messages,
    isThinking: state.isThinking,
    currentPNR: state.currentPNR,
    currentIntent: state.currentIntent,
    identified: state.identified,
    sendMessage,
    selectAction,
  };
}
