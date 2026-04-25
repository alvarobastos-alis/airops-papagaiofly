// ==========================================
// AirOps AI — Agent / Conversation Types
// ==========================================

export type Intent =
  | 'flight-status'
  | 'change-flight'
  | 'cancel-flight'
  | 'request-refund'
  | 'resolve-baggage'
  | 'lost-connection'
  | 'denied-boarding'
  | 'request-assistance'
  | 'check-in-help'
  | 'loyalty-inquiry'
  | 'general-inquiry'
  | 'unknown';

export type AgentStep =
  | 'identifying'
  | 'querying-systems'
  | 'analyzing-rules'
  | 'deciding'
  | 'executing'
  | 'responding'
  | 'escalating';

export interface AgentAction {
  type: 'reaccommodation' | 'reschedule' | 'credit' | 'refund' | 'voucher' | 'baggage-report' | 'escalation' | 'info';
  title: string;
  description: string;
  details?: Record<string, string>;
  selectable?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  timestamp: string;
  actions?: AgentAction[];
  thinkingSteps?: ThinkingStep[];
  isThinking?: boolean;
  securityPipeline?: {
    piiMasked: boolean;
    jailbreakDetected: boolean;
    guardrailsPassed: boolean;
    violations: Array<{ rule: string; severity: string }>;
  };
}

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
  detail?: string;
}

export interface AgentSession {
  id: string;
  pnr?: string;
  passengerName?: string;
  intent?: Intent;
  status: 'active' | 'resolved' | 'escalated' | 'closed';
  startedAt: string;
  resolvedAt?: string;
  messages: ChatMessage[];
  scenarioId?: string;
  channel: 'voice' | 'chat' | 'whatsapp';
  automationUsed: boolean;
  toolsCalled: string[];
  resolution?: string;
}

export interface DashboardMetrics {
  automationRate: number;
  fcr: number; // First Contact Resolution
  avgHandlingTime: number; // seconds
  costPerInteraction: number;
  voucherAcceptanceRate: number;
  escalationRate: number;
  activeSessions: number;
  totalToday: number;
  nps: number;
  csat: number;
}
