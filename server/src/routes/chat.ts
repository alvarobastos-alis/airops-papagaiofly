// ==========================================
// AirOps AI — Chat Route (Refactored)
// Integrates Decision Engine + Auth + RAG
// ==========================================

import { Router } from 'express';
import { createSecurityContext } from '../security/pipeline.js';
import { env } from '../config/env.js';
import { securePnrLookup } from '../services/authEngine.js';
import { evaluateFlightDisruption, evaluateRefundEligibility, evaluateBaggageRights, calculateAssistanceVouchers, prioritizeResolution } from '../services/decisionEngine.js';
import { searchKnowledge } from '../services/rag.js';
import { detectConversationSignals, selectConversationMode, buildToneGuidance, ANTI_BIAS_GUARDRAIL } from '../services/toneEngine.js';
import { db } from '../db/sqlite.js';

const router = Router();

/**
 * POST /api/chat/message
 */
router.post('/message', async (req, res) => {
  try {
    const { message, conversationId, pnr, channel = 'chat' } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const security = createSecurityContext({
      userMessage: message,
      agentType: channel === 'voice' ? 'sac-agent-voice-v1' : 'sac-agent-v1',
      includeANAC: true,
      variables: { PNR: pnr || '', TENANT_NAME: 'AirOps' },
    });

    if (security.jailbreakDetected) {
      console.warn(`⚠️ Jailbreak attempt detected: ${security.jailbreakPatterns.join(', ')}`);
    }

    // ---- Ethical Personalization: Tone Engine ----
    const conversationSignals = detectConversationSignals(message);
    const intent = classifyIntentFromMessage(message);
    const mode = selectConversationMode(
      intent,
      null, // disruptionType will be filled after PNR lookup
      conversationSignals,
      security.jailbreakDetected
    );
    const toneContext = buildToneGuidance(mode, conversationSignals, {});

    // Persist conversation signals for observability
    try {
      db.prepare(`INSERT INTO conversation_signals (session_id, detected_confusion, detected_frustration, detected_anxiety, requested_human, asked_to_repeat, urgency_level, conversation_mode, message_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`).run(
        conversationId || `SES-${Date.now()}`,
        conversationSignals.detected_confusion ? 1 : 0,
        conversationSignals.detected_frustration ? 1 : 0,
        conversationSignals.detected_anxiety ? 1 : 0,
        conversationSignals.requested_human ? 1 : 0,
        conversationSignals.asked_to_repeat ? 1 : 0,
        conversationSignals.urgency_level || 'low',
        mode
      );
    } catch { /* non-critical */ }

    let llmResponse: string;

    if (env.OPENAI_API_KEY === 'sk-placeholder') {
      llmResponse = getSmartMockResponse(message, pnr);
    } else {
      // Production: OpenAI with tools
      const tools = buildTools();
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: security.systemPrompt },
            { role: 'user', content: security.sanitizedInput },
          ],
          max_tokens: 1000,
          temperature: 0.3,
          tools,
        }),
      });

      const data = (await openaiRes.json()) as any;
      const messageResponse = data.choices?.[0]?.message;

      if (messageResponse?.tool_calls?.length > 0) {
        const messages: any[] = [
          { role: 'system', content: security.systemPrompt },
          { role: 'user', content: security.sanitizedInput },
          messageResponse,
        ];

        for (const toolCall of messageResponse.tool_calls) {
          const toolResult = await executeToolCall(toolCall);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });
        }

        const secondRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 1000, temperature: 0.3 }),
        });

        const secondData = (await secondRes.json()) as any;
        llmResponse = secondData.choices?.[0]?.message?.content || 'Concluí a ação solicitada.';
      } else {
        llmResponse = messageResponse?.content || 'Desculpe, não consegui processar sua mensagem.';
      }
    }

    const result = security.validateResponse(llmResponse);

    res.json({
      response: result.finalOutput,
      conversationId,
      toneMode: mode,
      security: {
        piiMasked: security.piiEntities.length > 0,
        jailbreakDetected: security.jailbreakDetected,
        guardrailsPassed: result.outputValidation?.passed ?? true,
        violations: result.outputValidation?.violations?.map(v => ({ rule: v.rule, severity: v.severity })) ?? [],
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/chat/test — Garak security testing
 */
router.post('/test', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) { res.status(400).json({ error: 'Prompt is required' }); return; }

  const security = createSecurityContext({ userMessage: prompt, agentType: 'sac-agent-v1' });
  const mockResponse = 'Sou um agente de atendimento e posso ajudar com questões relacionadas a voos e reservas.';
  const result = security.validateResponse(mockResponse);

  res.json({
    response: result.finalOutput,
    securityFlags: { jailbreakDetected: security.jailbreakDetected, patterns: security.jailbreakPatterns },
  });
});

// ---- Tool Definitions ----

function buildTools() {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'lookup_pnr',
        description: 'Buscar reserva por localizador PNR e sobrenome do passageiro.',
        parameters: {
          type: 'object',
          properties: {
            locator: { type: 'string', description: 'Código PNR de 6 caracteres' },
            lastName: { type: 'string', description: 'Sobrenome do passageiro' },
          },
          required: ['locator'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'check_passenger_rights',
        description: 'Avalia os direitos do passageiro (ANAC) baseado no status do voo. SEMPRE use APÓS consultar o PNR.',
        parameters: {
          type: 'object',
          properties: {
            locator: { type: 'string' },
            delayMinutes: { type: 'number' },
            isCancelled: { type: 'boolean' },
            isOverbooking: { type: 'boolean' },
          },
          required: ['locator'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_anac_rules',
        description: 'Busca na base de conhecimento regras ANAC e políticas da companhia.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Tópico para buscar' } },
          required: ['query'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'execute_action',
        description: 'Executa ação operacional: reacomodação, reembolso, voucher. Só usar APÓS verificar direitos.',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['rebook', 'refund', 'issue_voucher', 'issue_flight_credit'] },
            pnr: { type: 'string' },
            amount: { type: 'number' },
          },
          required: ['action', 'pnr'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'transfer_to_human',
        description: 'Escalar para atendente humano. Use quando o passageiro pedir explicitamente ou quando houver raiva extrema.',
        parameters: {
          type: 'object',
          properties: { reason: { type: 'string' } },
          required: ['reason'],
        },
      },
    },
  ];
}

// ---- Tool Execution ----

async function executeToolCall(toolCall: any): Promise<string> {
  try {
    const args = JSON.parse(toolCall.function.arguments);
    const toolName = toolCall.function.name;

    if (toolName === 'lookup_pnr') {
      const result = securePnrLookup(args.locator?.toUpperCase(), args.lastName);
      return JSON.stringify(result);
    }

    if (toolName === 'check_passenger_rights') {
      const result = securePnrLookup(args.locator?.toUpperCase());
      if (!result.found) return JSON.stringify({ error: 'PNR not found' });

      const seg = result.pnr.segments?.[0];
      const delayMin = args.delayMinutes ?? seg?.delay_minutes ?? 0;
      const isCancelled = args.isCancelled ?? seg?.segment_status === 'cancelled';
      const disruption = evaluateFlightDisruption(delayMin, isCancelled, args.isOverbooking ?? false);

      let refundInfo = null;
      if (result.pnr.tickets?.[0]) {
        const t = result.pnr.tickets[0];
        refundInfo = evaluateRefundEligibility(
          { refundable: !!t.refundable, change_fee: t.change_fee || 0, cancel_fee: t.cancel_fee || 0, voucher_allowed: !!t.voucher_allowed, fare_family: t.fare_family || 'basic' },
          (isCancelled || delayMin >= 240) ? 'involuntary' : 'voluntary',
          t.total_amount || 0
        );
      }

      const vouchers = calculateAssistanceVouchers(delayMin, true);
      return JSON.stringify({ disruption, refundInfo, vouchers });
    }

    if (toolName === 'get_anac_rules') {
      const ragFindings = await searchKnowledge(args.query, 3);
      return JSON.stringify({ context_found: ragFindings });
    }

    if (toolName === 'execute_action') {
      const result = securePnrLookup(args.pnr?.toUpperCase());
      if (!result.found) return JSON.stringify({ status: 'error', message: 'PNR não encontrado.' });

      const ticket = result.pnr.tickets?.[0];

      if (args.action === 'refund') {
        if (ticket && !ticket.refundable) {
          const seg = result.pnr.segments?.[0];
          const isIROP = seg?.segment_status === 'cancelled' || (seg?.delay_minutes || 0) >= 240;
          if (!isIROP) {
            return JSON.stringify({
              status: 'error',
              SystemBlock: 'REJECTED_BY_RULE_ENGINE',
              message: `Ação Negada. A tarifa ${ticket.fare_family || ticket.fare_basis} NÃO permite reembolso voluntário. Você DEVE informar o passageiro e oferecer alternativas (crédito de voo ou remarcação).`,
            });
          }
        }
        db.prepare('UPDATE pnr_reservations SET reservation_status = ? WHERE locator = ?').run('refunded', args.pnr.toUpperCase());
        return JSON.stringify({ status: 'success', action: 'refund', message: 'Reembolso processado com sucesso.' });
      }

      if (args.action === 'rebook') {
        db.prepare('UPDATE pnr_reservations SET reservation_status = ? WHERE locator = ?').run('rebooked', args.pnr.toUpperCase());
        return JSON.stringify({ status: 'success', action: 'rebook', message: 'Reacomodação realizada com sucesso.' });
      }

      if (args.action === 'issue_voucher' || args.action === 'issue_flight_credit') {
        return JSON.stringify({ status: 'success', action: args.action, message: `Voucher/crédito emitido com sucesso. Validade: 12 meses.` });
      }

      return JSON.stringify({ status: 'success', action: args.action });
    }

    if (toolName === 'transfer_to_human') {
      db.prepare(`INSERT INTO human_handoff_queue (handoff_id, reason, priority, summary_for_agent, handoff_status) VALUES (?, ?, 'high', ?, 'pending')`).run(
        `HAND-${Date.now()}`, args.reason, `Passageiro solicitou atendimento humano: ${args.reason}`
      );
      return JSON.stringify({ status: 'success', message: `Escalonamento registrado. Motivo: ${args.reason}. Encerre a interação de forma educada.` });
    }

    return JSON.stringify({ status: 'unknown_tool' });
  } catch (e) {
    return JSON.stringify({ error: 'Failed to execute tool' });
  }
}

// ---- Smart Mock Response (when no API key) ----

function getSmartMockResponse(message: string, pnr?: string): string {
  const lower = message.toLowerCase();

  // If PNR provided, lookup real data
  if (pnr) {
    const result = securePnrLookup(pnr.toUpperCase());
    if (result.found) {
      const p = result.pnr;
      const seg = p.segments?.[0];
      const pax = p.passengers?.[0];
      const ticket = p.tickets?.[0];

      if (lower.includes('status') || lower.includes('voo') || lower.includes('vôo')) {
        if (seg) {
          if (seg.segment_status === 'cancelled') {
            const disruption = evaluateFlightDisruption(0, true, false);
            return `${pax?.first_name || 'Passageiro'}, seu voo ${seg.flight_number} de ${seg.origin} para ${seg.destination} foi **cancelado**. ${disruption.customerMessage}`;
          }
          if (seg.segment_status === 'delayed') {
            const disruption = evaluateFlightDisruption(seg.delay_minutes, false, false);
            return `${pax?.first_name || 'Passageiro'}, seu voo ${seg.flight_number} de ${seg.origin} para ${seg.destination} está com atraso de **${seg.delay_minutes} minutos**. ${disruption.customerMessage}`;
          }
          return `${pax?.first_name || 'Passageiro'}, seu voo ${seg.flight_number} de ${seg.origin} para ${seg.destination} está **confirmado e no horário**. Partida prevista: ${new Date(seg.scheduled_departure).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}, Portão ${seg.gate || 'a confirmar'}.`;
        }
      }

      if (lower.includes('cancelar') || lower.includes('cancela') || lower.includes('reembolso')) {
        if (ticket) {
          const isIROP = seg?.segment_status === 'cancelled' || (seg?.delay_minutes || 0) >= 240;
          const refund = evaluateRefundEligibility(
            { refundable: !!ticket.refundable, change_fee: ticket.change_fee || 0, cancel_fee: ticket.cancel_fee || 0, voucher_allowed: !!ticket.voucher_allowed, fare_family: ticket.fare_family || 'basic' },
            isIROP ? 'involuntary' : 'voluntary',
            ticket.total_amount || 0
          );
          if (refund.allowed) {
            return `${pax?.first_name || 'Passageiro'}, ${refund.reason} Valor do reembolso: **R$ ${refund.refundAmount?.toFixed(2)}**. ${refund.penaltyAmount ? `Multa: R$ ${refund.penaltyAmount.toFixed(2)}.` : ''} Deseja prosseguir?`;
          }
          return `${pax?.first_name || 'Passageiro'}, ${refund.reason} ${refund.alternativeActions.length > 0 ? 'Posso oferecer um crédito de voo ou remarcação.' : ''}`;
        }
      }

      if (lower.includes('bagagem') || lower.includes('mala')) {
        const bags = p.baggage?.filter((b: any) => b.baggage_status === 'missing' || b.baggage_status === 'delayed');
        if (bags?.length) {
          const bag = bags[0];
          const rights = evaluateBaggageRights(true, bag.days_missing || 0);
          return `${pax?.first_name || 'Passageiro'}, localizei o registro da sua bagagem (PIR: ${bag.pir_number || 'em aberto'}). ${rights.customerMessage}`;
        }
        return `${pax?.first_name || 'Passageiro'}, não encontrei nenhuma ocorrência de bagagem para sua reserva. Sua bagagem está em situação normal.`;
      }

      return `Olá, ${pax?.first_name || 'Passageiro'}! Identifiquei sua reserva **${p.locator}** (voo ${seg?.flight_number || '—'}, ${seg?.origin || ''} → ${seg?.destination || ''}). Como posso ajudar?`;
    }
  }

  // Generic responses
  if (lower.includes('status') || lower.includes('voo')) return 'Por favor, me informe o código da sua reserva (PNR) para que eu consulte o status do seu voo.';
  if (lower.includes('cancelar') || lower.includes('reembolso')) return 'Para verificar as opções de cancelamento ou reembolso, preciso do seu PNR. Pode me informar?';
  if (lower.includes('bagagem') || lower.includes('mala')) return 'Vou verificar o status da sua bagagem. Qual é o seu PNR?';
  if (lower.includes('atras')) return 'Entendo que seu voo está atrasado. Me passe o PNR para que eu verifique seus direitos.';
  if (lower.includes('reacomoda')) return 'Posso ajudar com reacomodação! Preciso do seu PNR para verificar as opções disponíveis.';
  return 'Olá! Sou o agente AirOps. Posso ajudar com status de voo, atrasos, cancelamentos, reacomodação, bagagem e reembolso. Por favor, me informe seu PNR para começar.';
}

// ---- Intent Classification for Tone Engine ----

function classifyIntentFromMessage(text: string): string {
  const lower = text.toLowerCase();
  if (/status|como.?est[áa]|hor[áa]rio|port[ãa]o|gate|terminal/i.test(lower)) return 'flight-status';
  if (/remarc|alter|mudar|trocar.*(data|voo|hor)/i.test(lower)) return 'change-flight';
  if (/cancel/i.test(lower)) return 'cancel-flight';
  if (/reembols|refund|devol|estorn/i.test(lower)) return 'request-refund';
  if (/bag|mala|mochila|extravi|perdi.*(bag|mala)|dano/i.test(lower)) return 'resolve-baggage';
  if (/conex|perdi.*(voo|conex)|transfer/i.test(lower)) return 'lost-connection';
  if (/overbooking|n[ãa]o.*embarca|impedid|preterid/i.test(lower)) return 'denied-boarding';
  if (/assist[eê]ncia|ajuda|hotel|aliment|voucher/i.test(lower)) return 'request-assistance';
  return 'general-inquiry';
}

export default router;
