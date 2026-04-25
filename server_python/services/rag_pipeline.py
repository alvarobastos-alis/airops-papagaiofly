# ==========================================
# AirOps AI — RAG Pipeline Orchestrator
# End-to-end: Query → Intent → Retrieve → Generate → Verify → Respond
# ==========================================

import json
import os
import time
from typing import Optional
from datetime import datetime, timezone

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from config.config_loader import (
    get_agent_config,
    get_agent_model_config,
    load_agent_prompt,
    get_guardrail_config,
)
from services.retriever import retrieve, format_context_for_llm
from services.groundedness import check_groundedness, get_fallback_message


def classify_intent(question: str) -> dict:
    """Classify the user's question intent and topic."""
    # Simple regex-based classification (expanded in Fase 7)
    import re
    lower = question.lower()

    intent = "general_inquiry"
    topic = None
    flight_scope = None
    needs_pnr = False

    # ORDER MATTERS: more specific patterns first, then broader ones

    # Reembolso BEFORE atraso (to avoid "cancelar passagem" matching "cancel" in atraso)
    if re.search(r"reembols|devol|estorn|dinheiro de volta|cancelar.*passag|cancelar.*reserv|cancelar.*bilhete|desistir|arrependimento|multa.*cancel", lower):
        intent = "reembolso"
        topic = "reembolso"
        needs_pnr = True
    elif re.search(r"power.?bank|bateria|l[ií]quido|perigoso|proibid|cigarro|vape|aerossol", lower):
        intent = "artigos_perigosos"
        topic = "artigos_perigosos"
    elif re.search(r"overbooking|preterid|preterição|n[ãa]o.*embarca|impedid.*embarca|tirar do voo|negaram embarque", lower):
        intent = "overbooking"
        topic = "atraso_cancelamento"
        needs_pnr = True
    elif re.search(r"atras|atraso|cancel|demora|não decolou|não saiu|assistência material", lower):
        intent = "assistencia_material"
        topic = "atraso_cancelamento"
        needs_pnr = True
    elif re.search(r"bag|mala|mochila|extravi|perdi.*mala|dano|quilo.*despacha|peso.*despacha|kit.*necessidade", lower):
        intent = "bagagem"
        topic = "bagagem"
        needs_pnr = True
    elif re.search(r"pet|cachorro|gato|animal|c[ãa]o.?guia|p[áa]ssaro|ave", lower):
        intent = "pet"
        topic = "transporte_animais"
    elif re.search(r"pnae|defici|acessib|cadeira.*roda|mobilidade|oxig[êe]nio|necessidade.*especial", lower):
        intent = "pnae"
        topic = "acessibilidade"
    elif re.search(r"carga|frete|mercadoria|envio|encomenda", lower):
        intent = "carga"
        topic = "carga"
    elif re.search(r"hotel|alimenta|voucher|hospeda|pernoite", lower):
        intent = "assistencia_material"
        topic = "atraso_cancelamento"
        needs_pnr = True
    elif re.search(r"document|passaporte|passport|identidade|menor.*viaja|cpf|visa|visto", lower):
        intent = "documentacao"
        topic = "documentacao"

    if re.search(r"internacional|exterior|fora do brasil|montreal", lower):
        flight_scope = "internacional"
    elif re.search(r"dom[ée]stic|nacional|dentro do brasil", lower):
        flight_scope = "domestico"

    return {
        "intent": intent,
        "topic": topic,
        "flight_scope": flight_scope,
        "business_scope": "passageiro",
        "needs_pnr": needs_pnr,
    }


def generate_answer(
    question: str,
    chunks: list[dict],
    intent: dict,
    agent_name: str = "rag_policy_agent",
) -> dict:
    """Generate a structured answer using the RAG policy agent."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if OpenAI is None or not api_key or api_key == "sk-placeholder":
        # Degraded mode — return chunks directly without LLM generation
        sources = [
            {
                "document_name": c.get("document_name", ""),
                "article": c.get("article"),
                "chunk_id": c.get("chunk_id", ""),
                "relevance_score": c.get("score"),
                "text_preview": c.get("text", "")[:200],
            }
            for c in chunks[:5]
        ]
        return {
            "answer": f"[Modo degradado — OPENAI_API_KEY não configurada] Encontrei {len(chunks)} fontes relevantes para sua pergunta sobre '{intent.get('intent', 'unknown')}'. Configure a chave da API para respostas completas.",
            "sources": sources,
            "confidence": "media",
            "needs_human_review": True,
            "missing_information": ["resposta_llm"],
            "mode": "degraded",
        }

    # Get agent and model config
    try:
        model_config = get_agent_model_config(agent_name)
        system_prompt = load_agent_prompt(agent_name)
    except (ValueError, FileNotFoundError):
        model_config = {"model": "gpt-5.5", "temperature": 0.0}
        system_prompt = "Você é um assistente de aviação. Responda com base nas fontes."

    # Format context
    context = format_context_for_llm(chunks)

    # Build user message
    user_message = f"""## Pergunta do passageiro
{question}

## Classificação
- Intent: {intent.get('intent', 'unknown')}
- Tema: {intent.get('topic', 'unknown')}
- Escopo de voo: {intent.get('flight_scope', 'não especificado')}

## Fontes recuperadas
{context}

Responda em JSON conforme o formato definido no prompt do sistema.
"""

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        response = client.chat.completions.create(
            model=model_config.get("model", "gpt-5.5"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=model_config.get("temperature", 0.0),
            max_tokens=model_config.get("max_output_tokens", 1200),
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)
        result["model_used"] = model_config.get("model", "unknown")
        return result

    except Exception as e:
        return {
            "answer": "Ocorreu um erro ao processar sua pergunta. Vou encaminhar para um especialista.",
            "sources": [],
            "confidence": "baixa",
            "needs_human_review": True,
            "missing_information": [],
            "error": str(e),
        }


def add_disclaimer(answer: dict, channel: str = "chat") -> dict:
    """Add legal disclaimer if the response is about rights/obligations."""
    disclaimer_required = answer.get("disclaimer_required", False)
    risk_topics = ["reembolso", "atraso_cancelamento", "bagagem", "overbooking", "indenizacao"]
    case_type = answer.get("case_type", "")

    if disclaimer_required or case_type in risk_topics:
        try:
            disclaimer_config = get_guardrail_config("legal_disclaimer")
            if channel == "voice":
                disclaimer = disclaimer_config.get("voice_template", "")
            else:
                disclaimer = disclaimer_config.get("chat_template", "")

            # Substitute source name if available
            sources = answer.get("sources", [])
            if sources:
                source_name = sources[0].get("document_name", "regulamentação vigente")
                disclaimer = disclaimer.replace("{source_name}", source_name)

            answer["disclaimer"] = disclaimer.strip()
        except (ValueError, FileNotFoundError):
            answer["disclaimer"] = (
                "⚠️ Esta informação é baseada na política da Papagaio Fly. "
                "Para situações específicas, entre em contato com a nossa central de atendimento."
            )

    return answer


def ask(
    question: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    channel: str = "chat",
) -> dict:
    """
    Main RAG pipeline entry point.

    Flow: Classify → Retrieve → Generate → Verify → Disclaimer → Log
    """
    start_time = time.time()

    # 1. Classify intent
    intent = classify_intent(question)

    # 2. Retrieve relevant chunks
    chunks = retrieve(
        query=question,
        topic=intent.get("topic"),
        flight_scope=intent.get("flight_scope"),
        business_scope=intent.get("business_scope"),
    )

    # 3. Generate structured answer
    answer = generate_answer(
        question=question,
        chunks=chunks,
        intent=intent,
    )

    # 4. Groundedness check
    groundedness = check_groundedness(
        answer=answer.get("answer", ""),
        chunks=chunks,
    )

    # 5. Block if groundedness fails
    if groundedness.get("should_block"):
        answer["answer"] = get_fallback_message()
        answer["confidence"] = "baixa"
        answer["needs_human_review"] = True
        answer["blocked_by_groundedness"] = True
        answer["block_reason"] = groundedness.get("block_reason", "")

    # 6. Add disclaimer
    answer = add_disclaimer(answer, channel=channel)

    # 7. Build final response
    latency = round(time.time() - start_time, 3)

    response = {
        "answer": answer.get("answer", ""),
        "sources": answer.get("sources", []),
        "confidence": answer.get("confidence", "baixa"),
        "needs_human_review": answer.get("needs_human_review", False),
        "missing_information": answer.get("missing_information", []),
        "disclaimer": answer.get("disclaimer"),
        "intent": intent,
        "groundedness": {
            "grounded": groundedness.get("grounded", False),
            "overall_confidence": groundedness.get("overall_confidence", "unknown"),
            "should_block": groundedness.get("should_block", False),
        },
        "metadata": {
            "chunks_retrieved": len(chunks),
            "model_used": answer.get("model_used", "unknown"),
            "latency_seconds": latency,
            "channel": channel,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }

    # 8. Build audit log entry (for saving to DB)
    response["_audit_log"] = {
        "user_id": user_id,
        "session_id": session_id,
        "question": question,
        "intent": intent.get("intent"),
        "topic": intent.get("topic"),
        "retrieved_chunk_ids": [c.get("chunk_id") for c in chunks],
        "answer": answer.get("answer", ""),
        "confidence": answer.get("confidence", ""),
        "grounded": groundedness.get("grounded", False),
        "blocked": groundedness.get("should_block", False),
        "needs_human_review": answer.get("needs_human_review", False),
        "model_used": answer.get("model_used", ""),
        "latency_seconds": latency,
        "channel": channel,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rag_version": "2026_04_25",
    }

    return response
