// ==========================================
// AirOps AI — Scenario Catalog Types
// ==========================================

export type ScenarioBlock =
  | 'status-info'        // Bloco 1 — Status e Informação
  | 'irops'              // Bloco 2 — Atrasos e Cancelamentos
  | 'voluntary-change'   // Bloco 3 — Alteração Voluntária
  | 'voluntary-cancel'   // Bloco 4 — Cancelamento Voluntário
  | 'connections'        // Bloco 5 — Conexões e Disrupção  
  | 'baggage'            // Bloco 6 — Bagagem
  | 'financial'          // Bloco 7 — Financeiro
  | 'loyalty';           // Bloco 8 — Cliente/Fidelidade

export type AutomationLevel = 'total' | 'high' | 'medium' | 'low' | 'manual';

export interface ScenarioStep {
  id: string;
  label: string;
  type: 'system-query' | 'rule-check' | 'decision' | 'action' | 'response' | 'escalation';
  description: string;
}

export interface Scenario {
  id: string;
  number: number;
  block: ScenarioBlock;
  blockEmoji: string;
  title: string;
  description: string;
  dataSources: string[];
  anacRule?: string;
  businessRule?: string;
  decisions: string[];
  outputs: string[];
  automationLevel: AutomationLevel;
  automationPercent: number;
  steps: ScenarioStep[];
  tags: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  frequency: 'very-high' | 'high' | 'medium' | 'low';
}

export interface ScenarioBlockInfo {
  id: ScenarioBlock;
  emoji: string;
  title: string;
  titlePt: string;
  color: string;
  scenarios: Scenario[];
}
