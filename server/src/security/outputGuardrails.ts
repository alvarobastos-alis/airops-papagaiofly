// ==========================================
// AirOps AI — Security: Output Guardrails (Layer 3)
// Filters unsafe/offensive content from LLM responses
// ==========================================

import { containsPII } from './piiMasking.js';

export interface GuardrailViolation {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  match?: string;
}

export interface GuardrailResult {
  passed: boolean;
  violations: GuardrailViolation[];
  sanitizedOutput?: string;
}

// Offensive content patterns (PT-BR adapted)
const OFFENSIVE_PATTERNS = [
  /\b(idiota|imbecil|estúpido|burro|cala\s*a?\s*boca)\b/i,
  /\b(merda|porra|caralho|f[ou]da-?se)\b/i,
];

// Competitor mentions
const COMPETITOR_PATTERNS = [
  /\b(latam|gol|azul|avianca|tap|american|delta|united)\b/i,
];

// Legal risk patterns
const LEGAL_RISK_PATTERNS = [
  /\b(garanto|prometo|100%\s*certo|com\s*certeza\s*absoluta)\b/i,
  /\b(processo|advogado|tribunal|indenização\s*de\s*R?\$\s*\d{4,})\b/i,
  /\b(n[aã]o\s+tem\s+direito|voc[eê]\s+n[aã]o\s+pode)\b/i,
];

// Hallucination indicators
const HALLUCINATION_PATTERNS = [
  /\bvoo\s+[A-Z]{2}\d{5,}\b/i,     // Fake flight numbers (too many digits)
  /\bR\$\s*\d{6,}\b/,               // Unrealistic amounts (R$100000+)
  /\b(2030|2029|2028)\b/,            // Future dates (likely hallucinated)
];

/**
 * Validates LLM output against all guardrail rules.
 * Returns pass/fail and list of violations.
 */
export function validateOutput(output: string): GuardrailResult {
  const violations: GuardrailViolation[] = [];

  // Check 1: PII leak in response
  if (containsPII(output)) {
    violations.push({
      rule: 'pii-leak',
      severity: 'critical',
      description: 'Response contains PII that should not be exposed',
    });
  }

  // Check 2: Offensive content
  for (const pattern of OFFENSIVE_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      violations.push({
        rule: 'offensive-content',
        severity: 'high',
        description: 'Response contains offensive language',
        match: match[0],
      });
    }
  }

  // Check 3: Competitor mentions
  for (const pattern of COMPETITOR_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      violations.push({
        rule: 'competitor-mention',
        severity: 'low',
        description: 'Response mentions a competitor airline',
        match: match[0],
      });
    }
  }

  // Check 4: Legal risk
  for (const pattern of LEGAL_RISK_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      violations.push({
        rule: 'legal-risk',
        severity: 'medium',
        description: 'Response contains legally risky language',
        match: match[0],
      });
    }
  }

  // Check 5: Possible hallucination
  for (const pattern of HALLUCINATION_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      violations.push({
        rule: 'possible-hallucination',
        severity: 'high',
        description: 'Response may contain hallucinated information',
        match: match[0],
      });
    }
  }

  // Check 6: Response too long (voice)
  if (output.length > 2000) {
    violations.push({
      rule: 'response-too-long',
      severity: 'low',
      description: 'Response exceeds recommended length for conversations',
    });
  }

  return {
    passed: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
    violations,
    sanitizedOutput: violations.length > 0 ? sanitizeOutput(output, violations) : output,
  };
}

/**
 * Sanitizes output by removing or replacing problematic content.
 */
function sanitizeOutput(output: string, violations: GuardrailViolation[]): string {
  let sanitized = output;

  for (const v of violations) {
    if (v.match) {
      switch (v.rule) {
        case 'offensive-content':
          sanitized = sanitized.replace(new RegExp(escapeRegex(v.match), 'gi'), '***');
          break;
        case 'competitor-mention':
          sanitized = sanitized.replace(new RegExp(escapeRegex(v.match), 'gi'), 'outra companhia');
          break;
        case 'pii-leak':
          // PII masking handles this
          break;
      }
    }
  }

  return sanitized;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
