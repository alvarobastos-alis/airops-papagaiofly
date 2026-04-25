# ==========================================
# AirOps AI — RAG Semantic Search Engine
# ==========================================

import json
import numpy as np
from db.knowledge import KNOWLEDGE_BASE
from db.sqlite_manager import get_db
from services.openai_client import get_openai_client, is_openai_available
from config.settings import settings


def fallback_search(query: str, top_k: int = 2) -> str:
    """Keyword-based fallback when OpenAI embeddings aren't available."""
    query_words = [w for w in query.lower().split() if len(w) > 2]

    scored = []
    for doc in KNOWLEDGE_BASE:
        doc_text = (doc["topic"] + " " + doc["content"]).lower()
        score = sum(1 for w in query_words if w in doc_text)
        scored.append((doc, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return "\n\n".join(
        f"* [{d['id']}] {d['topic']}:\n{d['content']}"
        for d, s in scored[:top_k]
    )


async def compile_rag():
    """Initialize RAG engine and generate embeddings if needed."""
    print("[RAG Engine] Compilando Base de Conhecimento Vetorial...")
    
    if not is_openai_available():
        print("[RAG Engine] OpenAI credentials missing. Defaulting to Keyword-Search.")
        return

    db = get_db()
    client = get_openai_client()
    
    count = db.execute("SELECT COUNT(*) FROM rag_chunks").fetchone()[0]
    if count < len(KNOWLEDGE_BASE):
        print(f"[RAG Engine] Gerando embeddings para {len(KNOWLEDGE_BASE)} documentos...")
        
        for doc in KNOWLEDGE_BASE:
            content = doc["topic"] + " " + doc["content"]
            try:
                response = await client.embeddings.create(
                    model=settings.OPENAI_EMBEDDING_MODEL,
                    input=content,
                    dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS
                )
                embedding_vector = response.data[0].embedding
                # Store as JSON string for SQLite (or use numpy binary)
                emb_str = json.dumps(embedding_vector)
                
                db.execute("""
                    INSERT OR REPLACE INTO rag_chunks 
                    (chunk_id, document_title, content, embedding, embedding_model)
                    VALUES (?, ?, ?, ?, ?)
                """, (doc["id"], doc["topic"], doc["content"], emb_str, settings.OPENAI_EMBEDDING_MODEL))
                
            except Exception as e:
                print(f"[RAG Engine] Erro ao gerar embedding para {doc['id']}: {e}")
                
        db.commit()
        print("[RAG Engine] Vetores carregados e armazenados com sucesso.")
    else:
        print("[RAG Engine] Base vetorial já está atualizada.")


async def search_knowledge(query: str, top_k: int = 2) -> str:
    """Search knowledge base using embeddings or fallback to keyword match."""
    if not is_openai_available():
        return fallback_search(query, top_k)

    client = get_openai_client()
    db = get_db()
    
    try:
        response = await client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=query,
            dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS
        )
        query_embedding = np.array(response.data[0].embedding)
        
        chunks = db.execute("SELECT * FROM rag_chunks WHERE embedding IS NOT NULL").fetchall()
        
        scored = []
        for chunk in chunks:
            doc_emb = np.array(json.loads(chunk["embedding"]))
            # Cosine similarity
            similarity = np.dot(query_embedding, doc_emb) / (np.linalg.norm(query_embedding) * np.linalg.norm(doc_emb))
            scored.append((chunk, similarity))
            
        scored.sort(key=lambda x: x[1], reverse=True)
        
        return "\n\n".join(
            f"* [{d['document_title']}]:\n{d['content']}"
            for d, s in scored[:top_k]
        )
        
    except Exception as e:
        print(f"[RAG Engine] Embedding search failed: {e}. Using fallback.")
        return fallback_search(query, top_k)
