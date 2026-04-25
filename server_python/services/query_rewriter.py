# ==========================================
# AirOps AI — Query Rewriter
# Conversational context for multi-turn RAG
# ==========================================

from typing import Optional


def rewrite_query(
    current_question: str,
    conversation_history: list[dict],
    max_history: int = 5,
) -> str:
    """
    Rewrite the current question using conversation history.
    
    Resolves pronouns and implicit references:
    - "E para internacional?" → "Assistência material por atraso em voo internacional"
    - "Quanto tempo?" → "Quanto tempo demora o reembolso de voo cancelado?"
    
    This is a simple rule-based rewriter. For production,
    consider using an LLM-based rewriter.
    """
    if not conversation_history:
        return current_question

    # Get recent context
    recent = conversation_history[-max_history:]
    
    # Check if current question is a follow-up (short, contains pronouns/references)
    lower = current_question.lower().strip()
    is_followup = (
        len(lower.split()) <= 6
        or lower.startswith("e ")
        or lower.startswith("mas ")
        or lower.startswith("e se")
        or lower.startswith("quanto")
        or lower.startswith("qual ")
        or "isso" in lower
        or "esse" in lower
        or "essa" in lower
        or "dele" in lower
        or "dela" in lower
        or "nesse caso" in lower
        or "no meu caso" in lower
    )

    if not is_followup:
        return current_question

    # Extract context from recent messages
    context_parts = []
    for msg in recent:
        if msg.get("role") == "user":
            content = msg.get("content", "")
            if content and len(content) > 10:
                context_parts.append(content)

    if not context_parts:
        return current_question

    # Build contextual query
    last_topic = context_parts[-1] if context_parts else ""
    rewritten = f"{current_question} (contexto: {last_topic})"

    return rewritten


def extract_session_context(conversation_history: list[dict]) -> dict:
    """
    Extract structured context from conversation history.
    
    Identifies: PNR, flight number, passenger name, etc.
    """
    import re
    
    context = {
        "pnr": None,
        "flight_number": None,
        "passenger_name": None,
        "topic_history": [],
    }

    all_text = " ".join(
        msg.get("content", "") for msg in conversation_history
        if msg.get("role") == "user"
    )

    # Extract PNR (6 alphanumeric characters)
    pnr_match = re.search(r"\b([A-Z0-9]{6})\b", all_text)
    if pnr_match:
        context["pnr"] = pnr_match.group(1)

    # Extract flight number (e.g., OP1234, AO 5678)
    flight_match = re.search(r"\b(OP|AO)\s*(\d{3,4})\b", all_text, re.IGNORECASE)
    if flight_match:
        context["flight_number"] = f"{flight_match.group(1).upper()}{flight_match.group(2)}"

    return context
