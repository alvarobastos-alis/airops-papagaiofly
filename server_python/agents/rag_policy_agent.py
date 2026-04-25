# ==========================================
# AirOps AI — RAG Policy Agent
# Specialist in regulations and passenger rights
# NEVER generates without source documents
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
)
from services.retriever import retrieve, format_context_for_llm
from services.groundedness import check_groundedness, get_fallback_message
from services.conflict_resolver import check_conflicts

AGENT_NAME = "rag_policy_agent"


async def answer_policy_question(
    question: str,
    intent: Optional[dict] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    channel: str = "chat",
) -> dict:
    """Full RAG pipeline for regulatory/policy questions."""
    intent = intent or {}

    try:
        agent_config = get_agent_config(AGENT_NAME)
        retrieval_config = agent_config.get("retrieval", {})
    except (ValueError, FileNotFoundError):
        retrieval_config = {"top_k": 5, "min_score": 0.78}

    # 1. Retrieve chunks
    chunks = retrieve(
        query=question,
        top_k=retrieval_config.get("top_k", 5),
        min_score=retrieval_config.get("min_score", 0.78),
        topic=intent.get("topic"),
        flight_scope=intent.get("flight_scope"),
        business_scope=intent.get("business_scope"),
        agent_name=AGENT_NAME,
    )

    # 2. Abstention — no chunks found
    if not chunks:
        return {
            "answer": get_fallback_message(),
            "sources": [], "confidence": "baixa",
            "needs_human_review": True,
            "missing_information": ["Nenhum documento relevante encontrado"],
            "abstention": True,
        }

    # 3. Check norm vs policy conflicts
    conflict = check_conflicts(chunks)

    # 4. Generate answer
    context = format_context_for_llm(chunks)

    if OpenAI is None:
        return {"answer": "Serviço de IA indisponível.", "sources": [], "confidence": "baixa", "needs_human_review": True}

    try:
        model_config = get_agent_model_config(AGENT_NAME)
        system_prompt = load_agent_prompt(AGENT_NAME)
    except (ValueError, FileNotFoundError):
        model_config = {"model": "gpt-5.5", "temperature": 0.0}
        system_prompt = "Responda com base nas fontes. Formato JSON."

    user_msg = f"## Pergunta\n{question}\n\n## Classificação\n- Intent: {intent.get('intent')}\n- Tema: {intent.get('topic')}\n- Escopo: {intent.get('flight_scope', 'N/A')}\n\n## Fontes\n{context}\n\nResponda em JSON."

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        response = client.chat.completions.create(
            model=model_config.get("model", "gpt-5.5"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            temperature=model_config.get("temperature", 0.0),
            max_tokens=model_config.get("max_output_tokens", 1200),
            response_format={"type": "json_object"},
        )
        answer = json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"answer": "Erro na base de conhecimento.", "sources": [], "confidence": "baixa", "needs_human_review": True, "error": str(e)}

    # 5. Groundedness
    groundedness = check_groundedness(answer=answer.get("answer", ""), chunks=chunks)

    if groundedness.get("should_block"):
        answer["answer"] = get_fallback_message()
        answer["confidence"] = "baixa"
        answer["needs_human_review"] = True
        answer["blocked_by_groundedness"] = True

    # 6. Add conflict info
    if conflict.get("conflict_detected"):
        answer["conflict_detected"] = True
        answer["conflict_details"] = conflict
        answer["needs_human_review"] = True

    # 7. Ensure sources exist
    if not answer.get("sources"):
        answer["sources"] = [
            {"document_name": c.get("document_name", ""), "article": c.get("article"), "chunk_id": c.get("chunk_id", ""), "relevance_score": c.get("score", 0)}
            for c in chunks[:3]
        ]

    answer["groundedness"] = {"grounded": groundedness.get("grounded", False), "overall_confidence": groundedness.get("overall_confidence", "unknown")}
    answer["model_used"] = model_config.get("model", "unknown")
    return answer
