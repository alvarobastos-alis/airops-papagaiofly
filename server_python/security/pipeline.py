# ==========================================
# AirOps AI — Security Pipeline (Orchestrator)
# Chains all security layers together
# ==========================================

from security.pii_masking import mask_pii
from security.safety_injection import get_system_prompt, detect_jailbreak
from security.output_guardrails import validate_output, mask_output_pii
from config.settings import settings


def create_security_context(user_message: str, agent_type: str = "sac-agent-v1", session_id: str | None = None, **kwargs) -> dict:
    """Pre-process pipeline: PII mask → jailbreak detect → safety injection."""

    # Layer 1: PII Masking
    pii_result = mask_pii(user_message) if settings.PII_MASKING_ENABLED else {"masked": user_message, "entities": [], "hasPII": False}

    # Layer 2: Jailbreak Detection
    jailbreak = detect_jailbreak(user_message)

    # Layer 2b: Safety Injection
    system_prompt = get_system_prompt() if settings.SAFETY_INJECTION_ENABLED else ""

    context = {
        "sanitizedInput": pii_result["masked"],
        "systemPrompt": system_prompt,
        "piiEntities": pii_result["entities"],
        "jailbreakDetected": jailbreak["isJailbreak"],
        "jailbreakPatterns": jailbreak["matchedPatterns"],
        "sessionId": session_id
    }

    return context


def validate_response(llm_output: str) -> dict:
    """Post-process: output guardrails + PII masking on output (Guardrail 3)."""
    
    # Apply Guardrail 3: Never output full sensitive data
    safe_output = mask_output_pii(llm_output) if settings.PII_MASKING_ENABLED else llm_output
    
    if settings.OUTPUT_GUARDRAILS_ENABLED:
        validation = validate_output(safe_output)
    else:
        validation = {"passed": True, "violations": [], "sanitizedOutput": safe_output}

    return {
        "finalOutput": validation.get("sanitizedOutput", safe_output),
        "outputValidation": validation,
    }
