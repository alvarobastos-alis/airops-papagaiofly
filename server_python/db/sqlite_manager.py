# ==========================================
# AirOps AI — SQLite Database Manager
# Schema: 37 tables for airline operations
# ==========================================

import sqlite3
import os
from pathlib import Path

DB_DIR = Path(__file__).parent.parent / "data"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "airops.sqlite"

_connection: sqlite3.Connection | None = None


def get_db() -> sqlite3.Connection:
    global _connection
    if _connection is None:
        _connection = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        _connection.row_factory = sqlite3.Row
        _connection.execute("PRAGMA journal_mode = WAL")
        _connection.execute("PRAGMA foreign_keys = ON")
    return _connection


SCHEMA_SQL = """
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

CREATE TABLE IF NOT EXISTS flight_status_events (
    id TEXT PRIMARY KEY,
    flight_id TEXT REFERENCES flight_segments(id),
    event_type TEXT,
    delay_minutes INTEGER DEFAULT 0,
    reason_code TEXT,
    reason_description TEXT,
    affected_passengers INTEGER DEFAULT 0,
    gate TEXT,
    terminal TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

-- ================================================
-- 2. FINANCEIRO
-- ================================================

CREATE TABLE IF NOT EXISTS tickets (
    ticket_number TEXT PRIMARY KEY,
    pnr TEXT REFERENCES pnr_reservations(locator),
    passenger_id TEXT REFERENCES passengers(id),
    segment_id TEXT,
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
    fare_family TEXT,
    refundable INTEGER DEFAULT 0,
    change_allowed INTEGER DEFAULT 0,
    change_fee REAL DEFAULT 0,
    cancel_fee REAL DEFAULT 0,
    no_show_penalty REAL DEFAULT 0,
    voucher_allowed INTEGER DEFAULT 0,
    free_rebooking_on_irop INTEGER DEFAULT 1,
    baggage_included INTEGER DEFAULT 0,
    baggage_weight_kg INTEGER DEFAULT 0,
    description TEXT
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    pnr TEXT REFERENCES pnr_reservations(locator),
    customer_id TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'approved',
    amount REAL DEFAULT 0,
    installments INTEGER DEFAULT 1,
    authorization_code TEXT,
    paid_at TEXT
);

CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    ticket_number TEXT REFERENCES tickets(ticket_number),
    pnr TEXT,
    payment_id TEXT,
    refund_type TEXT DEFAULT 'voluntary',
    refund_reason TEXT,
    amount REAL DEFAULT 0,
    penalty_amount REAL DEFAULT 0,
    refund_status TEXT DEFAULT 'requested',
    payment_method TEXT,
    requested_at TEXT DEFAULT (datetime('now')),
    estimated_completion_date TEXT,
    processed_at TEXT
);

CREATE TABLE IF NOT EXISTS vouchers_emds (
    id TEXT PRIMARY KEY,
    emd_number TEXT,
    pnr TEXT,
    customer_id TEXT,
    voucher_type TEXT DEFAULT 'flight_credit',
    amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    status TEXT DEFAULT 'active',
    issued_reason TEXT,
    valid_until TEXT,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ================================================
-- 3. BAGAGEM
-- ================================================

CREATE TABLE IF NOT EXISTS baggage_items (
    tag_number TEXT PRIMARY KEY,
    pnr TEXT,
    passenger_id TEXT,
    segment_id TEXT,
    bag_tag TEXT,
    weight_kg REAL DEFAULT 0,
    baggage_status TEXT DEFAULT 'checked',
    last_known_airport TEXT,
    pir_number TEXT,
    description TEXT,
    days_missing INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_baggage_pnr ON baggage_items(pnr);

CREATE TABLE IF NOT EXISTS baggage_events (
    id TEXT PRIMARY KEY,
    tag_number TEXT REFERENCES baggage_items(tag_number),
    event_time TEXT,
    airport TEXT,
    event_type TEXT,
    event_description TEXT
);

-- ================================================
-- 4. OPERAÇÕES IRREGULARES (IROPs)
-- ================================================

CREATE TABLE IF NOT EXISTS irregular_operations (
    id TEXT PRIMARY KEY,
    flight_id TEXT REFERENCES flight_segments(id),
    irop_type TEXT,
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
-- 5. SUPORTE AO CLIENTE
-- ================================================

CREATE TABLE IF NOT EXISTS support_cases (
    case_id TEXT PRIMARY KEY,
    pnr TEXT,
    customer_id TEXT,
    scenario_id TEXT,
    case_type TEXT,
    priority TEXT DEFAULT 'medium',
    case_status TEXT DEFAULT 'open',
    opened_channel TEXT DEFAULT 'chat',
    assigned_to TEXT DEFAULT 'ai_agent',
    opened_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    csat_score REAL
);

CREATE TABLE IF NOT EXISTS support_interactions (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES support_cases(case_id),
    session_id TEXT,
    channel TEXT DEFAULT 'chat',
    sender TEXT DEFAULT 'customer',
    message TEXT,
    intent_detected TEXT,
    tone_detected TEXT,
    sentiment TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS human_handoff_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handoff_id TEXT UNIQUE,
    session_id TEXT,
    case_id TEXT,
    reason TEXT,
    priority TEXT DEFAULT 'medium',
    summary_for_agent TEXT,
    handoff_status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

-- ================================================
-- 6. REGULATÓRIO / COMPLIANCE
-- ================================================

CREATE TABLE IF NOT EXISTS regulatory_decision_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    case_id TEXT,
    pnr TEXT,
    decision_type TEXT,
    rule_applied TEXT,
    options_offered TEXT,
    customer_choice TEXT,
    input_data TEXT,
    output_data TEXT,
    evidence TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS material_assistance (
    id TEXT PRIMARY KEY,
    pnr TEXT,
    customer_id TEXT,
    flight_id TEXT,
    assistance_type TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'issued',
    voucher_code TEXT,
    issued_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reaccommodation_options (
    id TEXT PRIMARY KEY,
    pnr TEXT,
    original_flight_id TEXT,
    new_flight_number TEXT,
    alternative_flight_id TEXT,
    departure_time TEXT,
    arrival_time TEXT,
    available_seats INTEGER DEFAULT 0,
    option_type TEXT,
    recommended INTEGER DEFAULT 0,
    selected INTEGER DEFAULT 0,
    offered_at TEXT DEFAULT (datetime('now'))
);

-- ================================================
-- 7. TELEMETRIA IA
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
    authenticated INTEGER DEFAULT 0,
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
    success INTEGER DEFAULT 1,
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
    session_id TEXT,
    case_id TEXT,
    intent TEXT,
    resolution_type TEXT,
    resolved_by TEXT DEFAULT 'ai',
    human_handoff INTEGER DEFAULT 0,
    customer_accepted INTEGER DEFAULT 1,
    refund_avoided REAL DEFAULT 0,
    voucher_cost REAL DEFAULT 0,
    business_impact TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qa_scores (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    accuracy_score REAL DEFAULT 0,
    policy_compliance_score REAL DEFAULT 0,
    empathy_score REAL DEFAULT 0,
    hallucination_detected INTEGER DEFAULT 0,
    review_status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS csat_predictions (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    predicted_csat REAL DEFAULT 3.0,
    actual_csat REAL,
    drivers TEXT,
    risk_of_complaint REAL DEFAULT 0.0,
    model_version TEXT DEFAULT 'v1'
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    customer_id TEXT,
    pnr TEXT,
    risk_type TEXT,
    risk_score REAL DEFAULT 0.0,
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

-- ================================================
-- 9. LGPD / CONSENTIMENTO
-- ================================================

CREATE TABLE IF NOT EXISTS consent_privacy_flags (
    customer_id TEXT PRIMARY KEY,
    can_contact_whatsapp INTEGER DEFAULT 1,
    can_contact_sms INTEGER DEFAULT 1,
    can_contact_email INTEGER DEFAULT 1,
    can_record_voice INTEGER DEFAULT 1,
    data_retention_group TEXT DEFAULT 'standard',
    consent_updated_at TEXT DEFAULT (datetime('now'))
);

-- ================================================
-- 10. POLÍTICAS DA EMPRESA
-- ================================================

CREATE TABLE IF NOT EXISTS company_policy_documents (
    policy_id TEXT PRIMARY KEY,
    policy_type TEXT NOT NULL,
    title TEXT NOT NULL,
    version TEXT DEFAULT '2026.1',
    effective_from TEXT,
    content_summary TEXT,
    source_uri TEXT
);

-- ================================================
-- 11. RAG CHUNKS (Vetorizados)
-- ================================================

CREATE TABLE IF NOT EXISTS rag_chunks (
    chunk_id TEXT PRIMARY KEY,
    source_type TEXT DEFAULT 'ANAC',
    document_title TEXT,
    section TEXT,
    content TEXT NOT NULL,
    embedding BLOB,
    embedding_model TEXT,
    valid_from TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ================================================
-- 12. RAG PIPELINE (Produção)
-- ================================================

CREATE TABLE IF NOT EXISTS rag_documents (
    document_id TEXT PRIMARY KEY,
    document_name TEXT NOT NULL,
    source_type TEXT,
    authority TEXT,
    tema_principal TEXT,
    subtemas TEXT,
    legal_weight TEXT,
    jurisdicao TEXT DEFAULT 'Brasil',
    flight_scope TEXT,
    business_scope TEXT,
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    versao TEXT,
    file_path TEXT,
    total_pages INTEGER DEFAULT 0,
    total_chars INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,
    needs_ocr INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 3,
    ingested_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rag_document_chunks (
    chunk_id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES rag_documents(document_id),
    chunk_index INTEGER DEFAULT 0,
    article TEXT,
    text TEXT NOT NULL,
    char_count INTEGER DEFAULT 0,
    split_method TEXT,
    topic TEXT,
    subtopics TEXT,
    legal_weight TEXT,
    flight_scope TEXT,
    business_scope TEXT,
    embedding_model TEXT DEFAULT 'text-embedding-3-large',
    qdrant_point_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_doc ON rag_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_topic ON rag_document_chunks(topic);

CREATE TABLE IF NOT EXISTS rag_query_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    session_id TEXT,
    question TEXT NOT NULL,
    intent TEXT,
    topic TEXT,
    flight_scope TEXT,
    business_scope TEXT,
    retrieved_chunk_ids TEXT,
    answer TEXT,
    sources TEXT,
    confidence TEXT,
    grounded INTEGER DEFAULT 0,
    blocked INTEGER DEFAULT 0,
    block_reason TEXT,
    needs_human_review INTEGER DEFAULT 0,
    conflict_detected INTEGER DEFAULT 0,
    disclaimer_added INTEGER DEFAULT 0,
    model_used TEXT,
    latency_seconds REAL DEFAULT 0,
    channel TEXT DEFAULT 'chat',
    rag_version TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rag_logs_session ON rag_query_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_logs_intent ON rag_query_logs(intent);
CREATE INDEX IF NOT EXISTS idx_rag_logs_grounded ON rag_query_logs(grounded);
"""

ALL_TABLES = [
    'pnr_reservations', 'passengers', 'customer_identity_map', 'loyalty_profiles',
    'flight_segments', 'pnr_segments', 'flight_status_events', 'tickets', 'fare_rules',
    'payments', 'refunds', 'vouchers_emds', 'baggage_items', 'baggage_events',
    'irregular_operations', 'support_cases', 'support_interactions', 'human_handoff_queue',
    'regulatory_decision_logs', 'material_assistance', 'reaccommodation_options',
    'agent_sessions', 'agent_tool_calls', 'agent_latency', 'agent_resolution_outcomes',
    'qa_scores', 'csat_predictions', 'fraud_alerts',
    'communication_preferences', 'conversation_signals',
    'consent_privacy_flags', 'company_policy_documents', 'rag_chunks',
    'rag_documents', 'rag_document_chunks', 'rag_query_logs',
]


def run_migrations():
    db = get_db()
    db.executescript(SCHEMA_SQL)
    print(f"✅ SQLite Schema: {len(ALL_TABLES)} tabelas criadas com sucesso.")


def reset_db():
    db = get_db()
    db.execute("PRAGMA foreign_keys = OFF")
    for table in ALL_TABLES:
        db.execute(f"DELETE FROM {table}")
    db.execute("PRAGMA foreign_keys = ON")
    db.commit()
    print(f"🧹 Todas as {len(ALL_TABLES)} tabelas limpas.")
