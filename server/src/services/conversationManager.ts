// ==========================================
// AirOps AI — Conversation Manager
// Session & message history for multi-turn
// ==========================================
import { db } from '../db/sqlite.js';
import { v4 as uuid } from 'uuid';

export function createSession(channel: string, pnr?: string) {
  const sessionId = uuid();
  db.prepare(`
    INSERT INTO agent_sessions (session_id, channel, pnr, started_at, session_status, authenticated, auth_level, total_messages)
    VALUES (?, ?, ?, datetime('now'), 'active', 0, 'none', 0)
  `).run(sessionId, channel, pnr || null);
  return sessionId;
}

export function addMessage(sessionId: string, role: string, content: string) {
  const id = uuid();
  db.prepare(`
    INSERT INTO support_interactions (id, session_id, channel, speaker, message, created_at)
    VALUES (?, ?, 'chat', ?, ?, datetime('now'))
  `).run(id, sessionId, role, content);
  db.prepare('UPDATE agent_sessions SET total_messages = total_messages + 1 WHERE session_id = ?').run(sessionId);
  return id;
}

export function getHistory(sessionId: string, limit = 20) {
  return db.prepare(`
    SELECT speaker as role, message as content, created_at
    FROM support_interactions
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(sessionId, limit).reverse() as { role: string; content: string; created_at: string }[];
}

export function endSession(sessionId: string, resolutionType?: string) {
  db.prepare(`
    UPDATE agent_sessions
    SET ended_at = datetime('now'), session_status = 'completed', resolution_type = ?
    WHERE session_id = ?
  `).run(resolutionType || 'unknown', sessionId);
}

export function logToolCall(sessionId: string, toolName: string, inputSummary: string, outputSummary: string, success: boolean, latencyMs: number) {
  db.prepare(`
    INSERT INTO agent_tool_calls (id, session_id, tool_name, input_summary, output_summary, success, latency_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(uuid(), sessionId, toolName, inputSummary, outputSummary, success ? 1 : 0, latencyMs);
}
