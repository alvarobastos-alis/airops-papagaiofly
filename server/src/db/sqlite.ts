import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Database as BetterSqlite3Database } from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'data', 'airops.sqlite');

export const db: BetterSqlite3Database = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ==========================================
// MIGRATION / SCHEMA DEFINITION (29 Tables)
// ==========================================

export function runMigrations() {
  db.exec(`
    -- ================================================
    -- 1. CORE OPERACIONAL (Cia Aérea / PSS)
    -- ================================================

    CREATE TABLE IF NOT EXISTS pnr_reservations (
      locator TEXT PRIMARY KEY,
      customer_id TEXT,
      booking_date TEXT,
      reservation_status TEXT DEFAULT 'confirmed',
      channel TEXT DEFAULT 'website',
      trip_type TEXT DEFAULT 'one_way',
      total_amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'BRL',
      contact_email TEXT,
      contact_phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS passengers (
      id TEXT PRIMARY KEY,
      pnr TEXT REFERENCES pnr_reservations(locator),
      customer_id TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      document_type TEXT DEFAULT 'cpf',
      document_number TEXT,
      document_last4 TEXT,
      date_of_birth TEXT,
      passenger_type TEXT DEFAULT 'adult',
      email_masked TEXT,
      phone_last4 TEXT,
      email TEXT,
      phone TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_passengers_pnr ON passengers(pnr);

    CREATE TABLE IF NOT EXISTS customer_identity_map (
      customer_id TEXT PRIMARY KEY,
      document_hash TEXT,
      email_hash TEXT,
      phone_hash TEXT,
      verified_phone_last4 TEXT,
      identity_risk_score REAL DEFAULT 0.0,
      last_verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS loyalty_profiles (
      customer_id TEXT PRIMARY KEY,
      loyalty_id TEXT,
      tier TEXT DEFAULT 'standard',
      miles_balance INTEGER DEFAULT 0,
      lifetime_value_score INTEGER DEFAULT 0,
      priority_service BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS flight_segments (
      id TEXT PRIMARY KEY,
      flight_number TEXT NOT NULL,
      airline TEXT DEFAULT 'AirOps',
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      scheduled_departure TEXT,
      scheduled_arrival TEXT,
      actual_departure TEXT,
      actual_arrival TEXT,
      segment_status TEXT DEFAULT 'on-time',
      delay_minutes INTEGER DEFAULT 0,
      delay_reason TEXT,
      gate TEXT,
      terminal TEXT,
      aircraft TEXT,
      cabin TEXT DEFAULT 'economy',
      seat TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_flights_status ON flight_segments(segment_status);
    CREATE INDEX IF NOT EXISTS idx_flights_number ON flight_segments(flight_number);

    CREATE TABLE IF NOT EXISTS pnr_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pnr TEXT REFERENCES pnr_reservations(locator),
      segment_id TEXT REFERENCES flight_segments(id),
      sequence_number INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_pnr_segments_pnr ON pnr_segments(pnr);

    CREATE TABLE IF NOT EXISTS flight_status_events (
      id TEXT PRIMARY KEY,
      flight_id TEXT REFERENCES flight_segments(id),
      event_type TEXT NOT NULL,
      delay_minutes INTEGER DEFAULT 0,
      reason_code TEXT,
      reason_description TEXT,
      new_gate TEXT,
      new_terminal TEXT,
      affected_passengers INTEGER DEFAULT 0,
      timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fse_flight ON flight_status_events(flight_id);

    CREATE TABLE IF NOT EXISTS tickets (
      ticket_number TEXT PRIMARY KEY,
      pnr TEXT REFERENCES pnr_reservations(locator),
      passenger_id TEXT REFERENCES passengers(id),
      segment_id TEXT REFERENCES flight_segments(id),
      fare_basis TEXT,
      ticket_status TEXT DEFAULT 'issued',
      issue_date TEXT,
      base_fare REAL DEFAULT 0,
      taxes REAL DEFAULT 0,
      total_amount REAL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_pnr ON tickets(pnr);

    CREATE TABLE IF NOT EXISTS fare_rules (
      fare_basis TEXT PRIMARY KEY,
      fare_family TEXT DEFAULT 'basic',
      refundable BOOLEAN DEFAULT 0,
      change_allowed BOOLEAN DEFAULT 1,
      change_fee REAL DEFAULT 0,
      cancel_fee REAL DEFAULT 0,
      no_show_penalty REAL DEFAULT 0,
      voucher_allowed BOOLEAN DEFAULT 1,
      free_rebooking_on_irop BOOLEAN DEFAULT 1,
      baggage_included INTEGER DEFAULT 0,
      baggage_weight_kg INTEGER DEFAULT 0,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      pnr TEXT REFERENCES pnr_reservations(locator),
      customer_id TEXT,
      payment_method TEXT DEFAULT 'credit_card',
      payment_status TEXT DEFAULT 'approved',
      amount REAL DEFAULT 0,
      installments INTEGER DEFAULT 1,
      authorization_code TEXT,
      paid_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      pnr TEXT REFERENCES pnr_reservations(locator),
      payment_id TEXT REFERENCES payments(id),
      ticket_number TEXT,
      refund_reason TEXT,
      refund_status TEXT DEFAULT 'pending',
      refund_amount REAL DEFAULT 0,
      requested_at TEXT DEFAULT (datetime('now')),
      estimated_completion_date TEXT
    );

    CREATE TABLE IF NOT EXISTS vouchers_emds (
      id TEXT PRIMARY KEY,
      emd_number TEXT,
      pnr TEXT REFERENCES pnr_reservations(locator),
      customer_id TEXT,
      voucher_type TEXT DEFAULT 'flight_credit',
      amount REAL DEFAULT 0,
      voucher_status TEXT DEFAULT 'active',
      issued_reason TEXT,
      expiration_date TEXT
    );

    CREATE TABLE IF NOT EXISTS baggage_items (
      tag_number TEXT PRIMARY KEY,
      pnr TEXT REFERENCES pnr_reservations(locator),
      passenger_id TEXT,
      segment_id TEXT,
      weight_kg REAL DEFAULT 0,
      baggage_status TEXT DEFAULT 'checked',
      last_known_airport TEXT,
      pir_number TEXT,
      description TEXT,
      days_missing INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS baggage_events (
      id TEXT PRIMARY KEY,
      tag_number TEXT REFERENCES baggage_items(tag_number),
      event_time TEXT DEFAULT (datetime('now')),
      airport TEXT,
      event_type TEXT,
      event_description TEXT
    );

    CREATE TABLE IF NOT EXISTS irregular_operations (
      id TEXT PRIMARY KEY,
      flight_id TEXT REFERENCES flight_segments(id),
      irop_type TEXT NOT NULL,
      severity TEXT DEFAULT 'medium',
      started_at TEXT,
      expected_resolution_at TEXT,
      reason_code TEXT,
      reason_description TEXT,
      affected_passengers INTEGER DEFAULT 0,
      regulatory_trigger TEXT,
      assistance_level TEXT DEFAULT 'none'
    );

    -- ================================================
    -- 2. SUPORTE E ATENDIMENTO
    -- ================================================

    CREATE TABLE IF NOT EXISTS support_cases (
      case_id TEXT PRIMARY KEY,
      pnr TEXT,
      customer_id TEXT,
      scenario_id TEXT,
      priority TEXT DEFAULT 'medium',
      case_status TEXT DEFAULT 'open',
      opened_channel TEXT DEFAULT 'chat',
      assigned_to TEXT DEFAULT 'ai_agent',
      opened_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      csat_score INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_cases_status ON support_cases(case_status);
    CREATE INDEX IF NOT EXISTS idx_cases_scenario ON support_cases(scenario_id);

    CREATE TABLE IF NOT EXISTS support_interactions (
      id TEXT PRIMARY KEY,
      case_id TEXT REFERENCES support_cases(case_id),
      session_id TEXT,
      channel TEXT,
      speaker TEXT,
      message TEXT,
      sentiment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS human_handoff_queue (
      handoff_id TEXT PRIMARY KEY,
      session_id TEXT,
      case_id TEXT,
      reason TEXT,
      priority TEXT DEFAULT 'medium',
      summary_for_agent TEXT,
      conversation_context TEXT,
      handoff_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      picked_at TEXT
    );

    -- ================================================
    -- 3. REGULATÓRIO E GOVERNANÇA
    -- ================================================

    CREATE TABLE IF NOT EXISTS regulatory_decision_logs (
      decision_id TEXT PRIMARY KEY,
      session_id TEXT,
      pnr TEXT,
      rule_applied TEXT,
      options_offered TEXT,
      customer_choice TEXT,
      evidence TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS material_assistance (
      id TEXT PRIMARY KEY,
      pnr TEXT,
      customer_id TEXT,
      assistance_type TEXT,
      amount REAL DEFAULT 0,
      assistance_status TEXT DEFAULT 'issued',
      issued_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reaccommodation_options (
      id TEXT PRIMARY KEY,
      pnr TEXT,
      original_segment_id TEXT,
      new_segment_id TEXT,
      available_seats INTEGER DEFAULT 0,
      recommended BOOLEAN DEFAULT 0,
      offered_at TEXT DEFAULT (datetime('now'))
    );

    -- ================================================
    -- 4. IA / TELEMETRIA
    -- ================================================

    CREATE TABLE IF NOT EXISTS agent_sessions (
      session_id TEXT PRIMARY KEY,
      case_id TEXT,
      customer_id TEXT,
      pnr TEXT,
      channel TEXT DEFAULT 'chat',
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      session_status TEXT DEFAULT 'active',
      authenticated BOOLEAN DEFAULT 0,
      auth_level TEXT DEFAULT 'none',
      total_messages INTEGER DEFAULT 0,
      resolution_type TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_tool_calls (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES agent_sessions(session_id),
      tool_name TEXT,
      input_summary TEXT,
      output_summary TEXT,
      success BOOLEAN DEFAULT 1,
      latency_ms INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_latency (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES agent_sessions(session_id),
      stt_latency_ms INTEGER DEFAULT 0,
      llm_latency_ms INTEGER DEFAULT 0,
      tool_latency_ms INTEGER DEFAULT 0,
      tts_latency_ms INTEGER DEFAULT 0,
      total_turn_latency_ms INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_resolution_outcomes (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES agent_sessions(session_id),
      case_id TEXT,
      intent TEXT,
      resolution_type TEXT,
      resolved_by TEXT DEFAULT 'ai',
      human_handoff BOOLEAN DEFAULT 0,
      customer_accepted BOOLEAN DEFAULT 1,
      refund_avoided REAL DEFAULT 0,
      voucher_cost REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS qa_scores (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES agent_sessions(session_id),
      accuracy_score REAL DEFAULT 0,
      policy_compliance_score REAL DEFAULT 0,
      empathy_score REAL DEFAULT 0,
      hallucination_detected BOOLEAN DEFAULT 0,
      review_status TEXT DEFAULT 'auto_approved'
    );

    CREATE TABLE IF NOT EXISTS csat_predictions (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES agent_sessions(session_id),
      predicted_csat REAL DEFAULT 4.0,
      drivers TEXT,
      risk_of_complaint REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS fraud_alerts (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      customer_id TEXT,
      pnr TEXT,
      risk_type TEXT,
      risk_score REAL DEFAULT 0,
      action_taken TEXT DEFAULT 'none',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ================================================
    -- 8. PERSONALIZAÇÃO ÉTICA (Context-based, never demographic)
    -- ================================================

    CREATE TABLE IF NOT EXISTS communication_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      preferred_language TEXT DEFAULT 'pt-BR',
      preferred_channel TEXT DEFAULT 'chat',
      communication_style TEXT DEFAULT 'default',
      accessibility_needs_declared TEXT,
      allow_personalization INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(customer_id)
    );

    CREATE TABLE IF NOT EXISTS conversation_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      detected_confusion INTEGER DEFAULT 0,
      detected_frustration INTEGER DEFAULT 0,
      detected_anxiety INTEGER DEFAULT 0,
      requested_human INTEGER DEFAULT 0,
      asked_to_repeat INTEGER DEFAULT 0,
      urgency_level TEXT DEFAULT 'low',
      conversation_mode TEXT DEFAULT 'informativo',
      message_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ SQLite Schema: 31 tabelas criadas com sucesso.');
}

export function resetDB() {
  const tables = [
    'pnr_reservations', 'passengers', 'customer_identity_map', 'loyalty_profiles',
    'flight_segments', 'pnr_segments', 'flight_status_events', 'tickets', 'fare_rules',
    'payments', 'refunds', 'vouchers_emds', 'baggage_items', 'baggage_events',
    'irregular_operations', 'support_cases', 'support_interactions', 'human_handoff_queue',
    'regulatory_decision_logs', 'material_assistance', 'reaccommodation_options',
    'agent_sessions', 'agent_tool_calls', 'agent_latency', 'agent_resolution_outcomes',
    'qa_scores', 'csat_predictions', 'fraud_alerts',
    'communication_preferences', 'conversation_signals'
  ];
  db.transaction(() => {
    for (const table of tables) {
      db.exec(`DELETE FROM ${table}`);
    }
  })();
  console.log('🧹 Todas as 31 tabelas limpas.');
}
