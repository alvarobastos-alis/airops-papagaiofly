// ==========================================
// AirOps AI — Security Pipeline (Orchestrator)
// Chains all 5 security layers together
// ==========================================

import { maskPII, unmaskPII, type PIIEntity, type PIIMaskResult } from './piiMasking.js';
import { buildInjectedPrompt, detectJailbreakAttempt } from './safetyInjection.js';
import { validateOutput, type GuardrailResult } from './outputGuardrails.js';
import { env } from '../config/env.js';

export interface SecurityPipelineInput {
  userMessage: string;
  agentType: 'sac-agent-v1' | 'sac-agent-voice-v1' | 'supervisor-agent-v1';
  scenario?: string;
  includeANAC?: boolean;
  variables?: Record<string, string>;
  tenantId?: string;
}

export interface SecurityPipelineResult {
  // Pre-LLM
  sanitizedInput: string;
  systemPrompt: string;
  piiEntities: PIIEntity[];
  jailbreakDetected: boolean;
  jailbreakPatterns: string[];

  // Post-LLM (filled after calling LLM)
  outputValidation?: GuardrailResult;
  finalOutput?: string;
}

/**
 * Pre-processing pipeline: runs BEFORE sending to LLM.
 *
 * Flow: User message → PII Mask → Jailbreak Detection → Safety Injection → Ready for LLM
 */
export function preProcess(input: SecurityPipelineInput): SecurityPipelineResult {
  // Layer 1: PII Masking
  let piiResult: PIIMaskResult = { masked: input.userMessage, entities: [], hasPII: false };
  if (env.PII_MASKING_ENABLED) {
    piiResult = maskPII(input.userMessage);
  }

  // Layer 2: Jailbreak Detection
  const jailbreak = detectJailbreakAttempt(input.userMessage);

  // Layer 2: Safety Injection (build system prompt)
  let systemPrompt = '';
  if (env.SAFETY_INJECTION_ENABLED) {
    systemPrompt = buildInjectedPrompt({
      agentType: input.agentType,
      scenario: input.scenario,
      includeANAC: input.includeANAC,
      variables: input.variables,
    });
  }

  return {
    sanitizedInput: piiResult.masked,
    systemPrompt,
    piiEntities: piiResult.entities,
    jailbreakDetected: jailbreak.isAttempt,
    jailbreakPatterns: jailbreak.patterns,
  };
}

/**
 * Post-processing pipeline: runs AFTER receiving LLM response.
 *
 * Flow: LLM response → Output Guardrails → PII re-check → Final output
 */
export function postProcess(
  llmOutput: string,
  preResult: SecurityPipelineResult,
): SecurityPipelineResult {
  // Layer 3: Output Guardrails
  let validation: GuardrailResult = { passed: true, violations: [] };
  if (env.OUTPUT_GUARDRAILS_ENABLED) {
    validation = validateOutput(llmOutput);
  }

  // Use sanitized output if guardrails modified it
  const finalOutput = validation.sanitizedOutput || llmOutput;

  return {
    ...preResult,
    outputValidation: validation,
    finalOutput,
  };
}

/**
 * Full pipeline: pre-process → (you call LLM) → post-process.
 * This is a convenience function that wraps both steps.
 */
export function createSecurityContext(input: SecurityPipelineInput) {
  const pre = preProcess(input);

  return {
    ...pre,
    /**
     * Call this after getting the LLM response to apply output guardrails.
     */
    validateResponse(llmOutput: string): SecurityPipelineResult {
      return postProcess(llmOutput, pre);
    },
  };
}
