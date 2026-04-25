# ==========================================
# AirOps AI — RAG API Route
# POST /api/rag/ask — Main RAG endpoint
# ==========================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.rag_pipeline import ask

router = APIRouter(prefix="/api/rag", tags=["RAG"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000, description="Pergunta do passageiro")
    user_id: Optional[str] = Field(None, description="ID do usuário autenticado")
    session_id: Optional[str] = Field(None, description="ID da sessão de conversa")
    channel: str = Field("chat", description="Canal: chat, voice, app")


class SourceItem(BaseModel):
    document_name: str = ""
    article: Optional[str] = None
    chunk_id: str = ""
    relevance_score: Optional[float] = None


class AskResponse(BaseModel):
    answer: str
    sources: list[dict] = []
    confidence: str = "baixa"
    needs_human_review: bool = False
    missing_information: list[str] = []
    disclaimer: Optional[str] = None
    intent: dict = {}
    groundedness: dict = {}
    metadata: dict = {}


@router.post("/ask", response_model=AskResponse)
async def rag_ask(request: AskRequest):
    """
    Ask a question to the RAG pipeline.

    The pipeline:
    1. Classifies intent and topic
    2. Retrieves relevant chunks from Qdrant
    3. Generates structured answer with citations
    4. Verifies groundedness (anti-hallucination)
    5. Adds legal disclaimer if needed
    6. Logs everything for audit
    """
    try:
        result = ask(
            question=request.question,
            user_id=request.user_id,
            session_id=request.session_id,
            channel=request.channel,
        )

        # Remove internal audit log from response (save to DB separately)
        audit_log = result.pop("_audit_log", None)

        # TODO: Save audit_log to SQLite rag_query_logs table

        return AskResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"RAG pipeline error: {str(e)}"
        )


@router.get("/health")
async def rag_health():
    """Check RAG pipeline health."""
    from config.config_loader import validate_all

    config_status = validate_all()

    # Check Qdrant connection
    qdrant_ok = False
    try:
        from qdrant_client import QdrantClient
        import os
        client = QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"),
            port=int(os.getenv("QDRANT_PORT", "6433")),
        )
        collections = client.get_collections()
        qdrant_ok = True
        qdrant_collections = [c.name for c in collections.collections]
    except Exception:
        qdrant_collections = []

    return {
        "status": "healthy" if all(config_status.values()) and qdrant_ok else "degraded",
        "configs": config_status,
        "qdrant": {
            "connected": qdrant_ok,
            "collections": qdrant_collections,
        },
    }
