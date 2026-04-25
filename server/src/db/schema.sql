-- ==========================================
-- AirOps AI — PostgreSQL Schema + RLS
-- Layer 4: Row-Level Security per tenant
-- ==========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TENANTS (Airlines)
-- ==========================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- USERS (Mapped from Clerk)
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id VARCHAR(100) UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'atendimento_1',
  -- Roles: atendimento_1, atendimento_2, atendimento_3, supervisor, coordenador, gerente, admin
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ==========================================
-- CONVERSATIONS
-- ==========================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  agent_id UUID REFERENCES users(id),
  pnr VARCHAR(10),
  passenger_name VARCHAR(200),
  channel VARCHAR(20) NOT NULL DEFAULT 'chat', -- chat, voice, whatsapp
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, resolved, escalated, abandoned
  intent VARCHAR(50),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  csat_score INTEGER,
  resolution VARCHAR(50),
  automated BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ==========================================
-- MESSAGES
-- ==========================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role VARCHAR(10) NOT NULL, -- user, agent, system
  content TEXT NOT NULL,
  pii_masked BOOLEAN DEFAULT FALSE,
  guardrail_violations JSONB DEFAULT '[]'::jsonb,
  thinking_steps JSONB,
  actions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SECURITY AUDIT LOG
-- ==========================================
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_type VARCHAR(50) NOT NULL,
  -- pii_detected, jailbreak_attempt, guardrail_violation, auth_failure, escalation
  severity VARCHAR(10) NOT NULL, -- low, medium, high, critical
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- KPI METRICS (aggregated)
-- ==========================================
CREATE TABLE kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL,
  -- { aht: 154, fcr: 85.1, nps: 72, automation_rate: 78.4, ... }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW-LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies: tenant isolation
-- The app sets `app.tenant_id` via SET before each query

CREATE POLICY tenant_conversations ON conversations
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_messages ON messages
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_audit ON security_audit_log
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_kpis ON kpi_snapshots
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_users ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_started ON conversations(started_at);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_audit_tenant_type ON security_audit_log(tenant_id, event_type);
CREATE INDEX idx_kpi_tenant_period ON kpi_snapshots(tenant_id, period_start);

-- ==========================================
-- SEED DATA (development)
-- ==========================================
INSERT INTO tenants (id, name, slug) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'AirOps Demo', 'airops-demo');
