# ==========================================
# AirOps AI — Hybrid Retriever
# Searches Qdrant with vector + metadata filters
# ==========================================

import os
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Filter,
        FieldCondition,
        MatchValue,
        MatchAny,
    )
except ImportError:
    QdrantClient = None

from config.config_loader import get_agent_config, get_model_config

COLLECTION_NAME = "airops_documents"
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6433"))


def _get_qdrant() -> "QdrantClient":
    """Get a Qdrant client instance."""
    if QdrantClient is None:
        raise ImportError("qdrant-client not installed")
    return QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def _get_openai() -> "OpenAI":
    """Get an OpenAI client instance."""
    if OpenAI is None:
        raise ImportError("openai not installed")
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _embed_query(query: str) -> list[float]:
    """Generate embedding for a search query."""
    client = _get_openai()
    embedding_config = get_model_config("embedding")

    response = client.embeddings.create(
        model=embedding_config["model"],
        input=query,
        dimensions=embedding_config.get("dimensions", 1536),
    )
    return response.data[0].embedding


def build_filters(
    topic: Optional[str] = None,
    source_type: Optional[str] = None,
    authority: Optional[str] = None,
    flight_scope: Optional[str] = None,
    business_scope: Optional[str] = None,
    active_only: bool = True,
) -> Optional[Filter]:
    """Build Qdrant filter conditions from metadata."""
    conditions = []

    if topic:
        conditions.append(FieldCondition(
            key="topic",
            match=MatchValue(value=topic),
        ))

    if source_type:
        conditions.append(FieldCondition(
            key="source_type",
            match=MatchValue(value=source_type),
        ))

    if authority:
        conditions.append(FieldCondition(
            key="authority",
            match=MatchValue(value=authority),
        ))

    if flight_scope:
        conditions.append(FieldCondition(
            key="flight_scope",
            match=MatchAny(any=[flight_scope]),
        ))

    if business_scope:
        conditions.append(FieldCondition(
            key="business_scope",
            match=MatchAny(any=[business_scope]),
        ))

    if not conditions:
        return None

    return Filter(must=conditions)


def retrieve(
    query: str,
    top_k: int = 8,
    min_score: float = 0.0,
    topic: Optional[str] = None,
    source_type: Optional[str] = None,
    authority: Optional[str] = None,
    flight_scope: Optional[str] = None,
    business_scope: Optional[str] = None,
    agent_name: str = "rag_policy_agent",
) -> list[dict]:
    """
    Retrieve relevant chunks from Qdrant.

    Uses agent config for defaults (top_k, min_score) but allows overrides.
    Results are reranked by priority (lower = more important).
    """
    # Get agent retrieval config
    try:
        agent_config = get_agent_config(agent_name)
        retrieval_config = agent_config.get("retrieval", {})
        top_k = retrieval_config.get("top_k", top_k)
        min_score = retrieval_config.get("min_score", min_score)
    except (ValueError, FileNotFoundError):
        pass  # Use defaults if config not available

    # Embed the query
    query_vector = _embed_query(query)

    # Build filters
    filters = build_filters(
        topic=topic,
        source_type=source_type,
        authority=authority,
        flight_scope=flight_scope,
        business_scope=business_scope,
    )

    # Search Qdrant (v1.17+ uses query_points)
    qdrant = _get_qdrant()

    # First search with larger top_k for reranking
    search_limit = top_k * 4  # Get more for potential reranking

    response = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=filters,
        limit=search_limit,
        with_payload=True,
        score_threshold=min_score,
    )
    results = response.points

    # Format results with priority boosting
    # Priority 0 (internal policy) gets +0.15 boost
    # Priority 1 (key regulations) gets +0.08 boost
    # Priority 2 gets +0.03 boost
    # Priority 3+ gets no boost
    PRIORITY_BOOST = {0: 0.15, 1: 0.08, 2: 0.03}

    chunks = []
    for hit in results:
        payload = hit.payload or {}
        priority = payload.get("priority", 3)
        boost = PRIORITY_BOOST.get(priority, 0.0)
        boosted_score = min(hit.score + boost, 1.0)

        chunks.append({
            "chunk_id": payload.get("chunk_id", ""),
            "document_id": payload.get("document_id", ""),
            "document_name": payload.get("document_name", ""),
            "source_type": payload.get("source_type", ""),
            "authority": payload.get("authority", ""),
            "legal_weight": payload.get("legal_weight", ""),
            "topic": payload.get("topic", ""),
            "article": payload.get("article"),
            "text": payload.get("text", ""),
            "score": round(boosted_score, 4),
            "original_score": round(hit.score, 4),
            "priority": priority,
            "flight_scope": payload.get("flight_scope", []),
            "business_scope": payload.get("business_scope", []),
        })

    # Sort by boosted score descending, then trim to top_k
    chunks.sort(key=lambda c: c["score"], reverse=True)
    return chunks[:top_k]


def format_context_for_llm(chunks: list[dict]) -> str:
    """Format retrieved chunks as context string for the LLM prompt."""
    if not chunks:
        return "[Nenhuma fonte encontrada]"

    parts = []
    for i, chunk in enumerate(chunks, 1):
        article = f" — {chunk['article']}" if chunk.get("article") else ""
        source = f"{chunk['document_name']}{article}"
        parts.append(
            f"[Fonte {i}] (score: {chunk['score']})\n"
            f"Documento: {source}\n"
            f"Tipo: {chunk['source_type']} | Autoridade: {chunk['authority']}\n"
            f"Texto: {chunk['text']}\n"
        )

    return "\n---\n".join(parts)
