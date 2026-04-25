// ==========================================
// AirOps AI — Voice Route
// Ephemeral token for OpenAI Realtime API
// ==========================================

import { Router } from 'express';
import { env } from '../config/env.js';
import { buildInjectedPrompt } from '../security/safetyInjection.js';
import { db } from '../db/sqlite.js';
import { searchKnowledge } from '../services/rag.js';

const router = Router();

/**
 * POST /api/voice/session
 * Creates an ephemeral token for WebRTC connection to OpenAI Realtime API.
 * The client uses this token to establish a direct WebRTC connection.
 */
router.post('/session', async (req, res) => {
  try {
    // Build the system prompt with safety injection
    const systemPrompt = buildInjectedPrompt({
      agentType: 'sac-agent-voice-v1',
      includeANAC: true,
      variables: req.body.variables || {},
    });

    // Define agent tools exactly like Chat tools
    const tools = [
      {
        type: 'function',
        name: 'lookup_pnr',
        description: 'Finds PNR details for a given passenger CPF or Email',
        parameters: {
          type: 'object',
          properties: { identifier: { type: 'string' } },
          required: ['identifier'],
        },
      },
      {
        type: 'function',
        name: 'get_anac_rules',
        description: 'Searches the RAG knowledge DB for airline policies and ANAC government rules based on the passengers query (e.g., flight delay, refund, pet in cabin, bags).',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string', description: 'The topic to search in the knowledge base' } },
          required: ['query'],
        },
      },
      {
        type: 'function',
        name: 'execute_action',
        description: 'Executa uma ação no sistema de reservas (reacomodação, reembolso, cancelamento).',
        parameters: {
          type: 'object',
          properties: {
            pnr: { type: 'string' },
            action: { type: 'string', enum: ['rebooked', 'refunded', 'cancelled'] }
          },
          required: ['action', 'pnr']
        }
      },
      {
        type: 'function',
        name: 'transfer_to_human',
        description: 'Triggers immediately when the passenger is highly angry, uses profanity, or explicitly requests to speak with a human agent. Escalates the call and ends AI interaction.',
        parameters: {
          type: 'object',
          properties: { reason: { type: 'string', description: 'Why was this escalated?' } },
          required: ['reason'],
        },
      },
      {
        type: 'function',
        name: 'request_csat_evaluation',
        description: 'Used at the very end of a resolved service to ask the user for a 1-5 rating on the provided assistance.',
        parameters: {
          type: 'object',
          properties: { prompt_message: { type: 'string' } },
          required: ['prompt_message'],
        },
      }
    ];

    // Request ephemeral token from OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_REALTIME_MODEL,
        voice: env.OPENAI_REALTIME_VOICE,
        instructions: systemPrompt,
        tools,
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI Realtime API error:', error);
      res.status(response.status).json({
        error: 'Failed to create voice session',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      });
      return;
    }

    const data = await response.json() as any;

    res.json({
      clientSecret: data.client_secret?.value,
      sessionId: data.id,
      expiresAt: data.client_secret?.expires_at,
    });
  } catch (error) {
    console.error('Voice session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/voice/tool-execute
 * Secure execution environment for WebRTC requested tools (RAG, SQLite).
 */
router.post('/tool-execute', async (req, res) => {
  try {
    const { toolName, args } = req.body;
    let toolResult = '';

    if (toolName === 'lookup_pnr') {
      const pnrRow = db.prepare('SELECT * FROM pnr_reservations WHERE locator = ?').get(args.identifier) as any;
      if (pnrRow) {
        const pax = db.prepare('SELECT * FROM passengers WHERE pnr = ?').all(args.identifier);
        const tkt = db.prepare('SELECT * FROM tickets WHERE pnr = ?').get(args.identifier) as any;
        let flight = null;
        if (tkt) {
           flight = db.prepare('SELECT * FROM flight_segments WHERE id = ?').get(tkt.flight_id);
        }
        toolResult = JSON.stringify({ 
          status: 'success', 
          pnr: { ...pnrRow, passengers: pax, flight } 
        });
      } else {
         toolResult = JSON.stringify({ status: 'error', message: 'PNR não encontrado.' });
      }
    } else if (toolName === 'get_anac_rules') {
      const ragFindings = await searchKnowledge(args.query, 2);
      toolResult = JSON.stringify({ context_found: ragFindings });
    } else if (toolName === 'execute_action') {
      const tkt = db.prepare('SELECT tickets.fare_basis, fare_rules.refundable FROM tickets JOIN fare_rules ON tickets.fare_basis = fare_rules.fare_basis WHERE tickets.pnr = ?').get(args.pnr) as { fare_basis: string, refundable: number };
      
      if (args.action === 'refund') {
        if (tkt && tkt.refundable === 0) {
           toolResult = JSON.stringify({ 
             status: 'error', 
             SystemBlock: 'REJECTED_BY_RULE_ENGINE', 
             message: `Ação Negada. A tarifa atual do PNR (${tkt.fare_basis}) não permite reembolso pelas regras da empresa.` 
           });
        } else {
           db.prepare('UPDATE pnr_reservations SET status = ? WHERE locator = ?').run('refunded', args.pnr);
           toolResult = JSON.stringify({ status: 'success', action: args.action });
        }
      } else {
        db.prepare('UPDATE pnr_reservations SET status = ? WHERE locator = ?').run(args.action, args.pnr);
        toolResult = JSON.stringify({ status: 'success', action: args.action });
      }
    } else if (toolName === 'transfer_to_human') {
      toolResult = JSON.stringify({ status: 'success', message: `Human fallback triggered para voz: ${args.reason}.` });
    } else if (toolName === 'request_csat_evaluation') {
      toolResult = JSON.stringify({ status: 'success', action: 'csat_sent' });
    } else {
      toolResult = JSON.stringify({ status: 'unknown_tool' });
    }

    res.json({ result: toolResult });
  } catch (error) {
    console.error('Tool Execute error:', error);
    res.status(500).json({ result: JSON.stringify({ error: 'Backend error' }) });
  }
});

export default router;
