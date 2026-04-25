# ==========================================
# AirOps AI — SAC Orchestrator Agent
# Central router: decides direct response, RAG, or escalation
# ==========================================

import json
import os
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from config.config_loader import (
    get_agent_config,
    get_agent_model_config,
    load_agent_prompt,
    get_agent_guardrails,
)
from services.retriever import retrieve, format_context_for_llm
from services.rag_pipeline import classify_intent, ask as rag_ask
from services.decision_engine import (
    evaluate_flight_disruption,
    evaluate_refund_eligibility,
    evaluate_baggage_rights,
)

# Import tool schemas
from tools.flight_tools import FLIGHT_TOOLS
from tools.reservation_tools import RESERVATION_TOOLS
from tools.refund_tools import REFUND_TOOLS
from tools.handoff_tools import HANDOFF_TOOLS

AGENT_NAME = "sac_orchestrator"

# Combine all tools
ALL_TOOLS = FLIGHT_TOOLS + RESERVATION_TOOLS + REFUND_TOOLS + HANDOFF_TOOLS


def _should_use_rag(intent: dict) -> bool:
    """Check if the question should be routed to the RAG policy agent."""
    rag_intents = {
        "assistencia_material", "pet", "pnae", "artigos_perigosos",
        "documentacao", "general_inquiry",
    }
    # Also route any intent if the topic is regulatory
    rag_topics = {
        "direitos_passageiro", "atraso_cancelamento", "transporte_animais",
        "acessibilidade", "artigos_perigosos", "documentacao",
    }
    return (
        intent.get("intent") in rag_intents
        or intent.get("topic") in rag_topics
    )


def _should_use_decision_engine(intent: dict, context: dict) -> bool:
    """Check if we can use deterministic decision engine rules."""
    # Decision engine handles specific operational decisions
    return (
        intent.get("intent") in {"assistencia_material", "reembolso", "bagagem", "overbooking"}
        and context.get("has_reservation_data")
    )


def _check_guardrails(action: str, session: dict) -> dict:
    """Validate action against agent guardrails."""
    try:
        guardrails = get_agent_guardrails(AGENT_NAME)
    except (ValueError, FileNotFoundError):
        return {"allowed": True, "reason": "no_guardrails_loaded"}

    for guard in guardrails:
        name = guard.get("name", "")

        # require_auth: check if action needs authentication
        if name == "require_auth":
            required_for = guard.get("required_for", [])
            if action in required_for and not session.get("authenticated"):
                return {
                    "allowed": False,
                    "reason": "auth_required",
                    "message": "Para acessar essas informações, preciso confirmar sua identidade. Poderia me informar seu PNR e sobrenome?",
                }

        # customer_scope_only: ensure data isolation
        if name == "customer_scope_only":
            if session.get("customer_id") and session.get("target_customer_id"):
                if session["customer_id"] != session["target_customer_id"]:
                    return {
                        "allowed": False,
                        "reason": "scope_violation",
                        "message": "Não posso acessar dados de outro passageiro.",
                    }

        # human_handoff_required: check trigger conditions
        if name == "human_handoff_required":
            triggers = guard.get("triggers", [])
            for trigger in triggers:
                if session.get(trigger):
                    return {
                        "allowed": False,
                        "reason": f"handoff_triggered:{trigger}",
                        "message": "Vou transferir para um atendente especializado para melhor atender o seu caso.",
                    }

    return {"allowed": True, "reason": "all_checks_passed"}


async def orchestrate(
    message: str,
    session: Optional[dict] = None,
    conversation_history: Optional[list] = None,
    channel: str = "chat",
) -> dict:
    """
    Main orchestrator entry point.

    Routes the message to the appropriate handler:
    1. Decision Engine (deterministic rules for known operational scenarios)
    2. RAG Policy Agent (regulatory/rights questions)
    3. Direct LLM + Tools (operational queries)
    4. Human Handoff (when confidence is low or triggers fire)
    """
    session = session or {}
    conversation_history = conversation_history or []

    # 1. Classify intent
    intent = classify_intent(message)

    # 2. Check guardrails before any action
    guardrail_check = _check_guardrails(
        action=intent.get("intent", "general_inquiry"),
        session=session,
    )

    if not guardrail_check["allowed"]:
        return {
            "type": "guardrail_block",
            "message": guardrail_check["message"],
            "reason": guardrail_check["reason"],
            "intent": intent,
        }

    # 3. Route based on intent
    route = "direct"

    # 3a. Try Decision Engine first (deterministic, most reliable)
    if _should_use_decision_engine(intent, session):
        route = "decision_engine"
        return await _route_decision_engine(message, intent, session)

    # 3b. Route to RAG for regulatory/rights questions
    if _should_use_rag(intent):
        route = "rag"
        rag_result = rag_ask(
            question=message,
            user_id=session.get("user_id"),
            session_id=session.get("session_id"),
            channel=channel,
        )
        return {
            "type": "rag_response",
            "route": route,
            "intent": intent,
            **rag_result,
        }

    # 3c. Direct LLM response for operational queries
    route = "direct"
    return await _route_direct_llm(message, intent, session, conversation_history)


async def _route_decision_engine(message: str, intent: dict, session: dict) -> dict:
    """Route to deterministic Decision Engine."""
    intent_name = intent.get("intent")

    if intent_name in ("assistencia_material", "overbooking"):
        # Need flight disruption data from session
        delay = session.get("delay_minutes", 0)
        is_cancelled = session.get("is_cancelled", False)
        is_overbooking = intent_name == "overbooking"

        decision = evaluate_flight_disruption(delay, is_cancelled, is_overbooking)
        return {
            "type": "decision_engine",
            "route": "decision_engine",
            "intent": intent,
            "decision": decision,
            "message": decision.get("customerMessage", ""),
            "rule_applied": decision.get("ruleApplied"),
        }

    elif intent_name == "reembolso":
        fare_rules = session.get("fare_rules", {})
        disruption_type = session.get("disruption_type", "voluntary")
        ticket_amount = session.get("ticket_amount", 0)

        decision = evaluate_refund_eligibility(fare_rules, disruption_type, ticket_amount)
        return {
            "type": "decision_engine",
            "route": "decision_engine",
            "intent": intent,
            "decision": decision,
            "message": decision.get("reason", ""),
            "rule_applied": decision.get("ruleApplied"),
        }

    elif intent_name == "bagagem":
        is_domestic = session.get("is_domestic", True)
        days_missing = session.get("days_missing", 0)

        decision = evaluate_baggage_rights(is_domestic, days_missing)
        return {
            "type": "decision_engine",
            "route": "decision_engine",
            "intent": intent,
            "decision": decision,
            "message": decision.get("customerMessage", ""),
            "rule_applied": decision.get("ruleApplied"),
        }

    return {"type": "fallback", "message": "Vou verificar isso para você."}


async def _route_direct_llm(
    message: str,
    intent: dict,
    session: dict,
    conversation_history: list,
) -> dict:
    """Route to direct LLM with function calling tools."""
    if OpenAI is None:
        return {"type": "error", "message": "Serviço de IA indisponível."}

    try:
        model_config = get_agent_model_config(AGENT_NAME)
        system_prompt = load_agent_prompt(AGENT_NAME)
    except (ValueError, FileNotFoundError):
        model_config = {"model": "gpt-5.5", "temperature": 0.2}
        system_prompt = "Você é a Zulu, assistente da Papagaio Fly. Seja simpática e acolhedora."

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history[-10:])  # Last 10 messages
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=model_config.get("model", "gpt-5.5"),
            messages=messages,
            temperature=model_config.get("temperature", 0.2),
            max_tokens=model_config.get("max_output_tokens", 800),
            tools=ALL_TOOLS,
        )

        choice = response.choices[0]

        if choice.message.tool_calls:
            tool_calls = [
                {
                    "tool": tc.function.name,
                    "arguments": json.loads(tc.function.arguments),
                }
                for tc in choice.message.tool_calls
            ]
            return {
                "type": "tool_call",
                "route": "direct",
                "intent": intent,
                "tool_calls": tool_calls,
                "message": choice.message.content or "",
            }

        return {
            "type": "direct_response",
            "route": "direct",
            "intent": intent,
            "message": choice.message.content or "",
        }

    except Exception as e:
        return {
            "type": "error",
            "intent": intent,
            "message": "Ocorreu um erro. Vou encaminhar para um atendente.",
            "error": str(e),
        }
