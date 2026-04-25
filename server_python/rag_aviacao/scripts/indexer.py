# ==========================================
# AirOps AI — Embedding Generator + Qdrant Indexer
# Generates embeddings and indexes into Qdrant
# ==========================================
#
# Usage:
#   python -m rag_aviacao.scripts.indexer
#
# Prerequisites:
#   - Qdrant running: docker compose up -d
#   - Chunks generated: python -m rag_aviacao.scripts.chunker
#   - OPENAI_API_KEY set in environment
#
# Input:  05_processados/chunks/*.json
# Output: Qdrant collection "airops_documents"
# ==========================================

import json
import sys
import os
import time
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent.parent / ".env")
except ImportError:
    pass

import numpy as np

try:
    from openai import OpenAI
except ImportError:
    print("openai not installed. Run: pip install openai")
    sys.exit(1)

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Distance,
        VectorParams,
        PointStruct,
        Filter,
        FieldCondition,
        MatchValue,
    )
except ImportError:
    print("qdrant-client not installed. Run: pip install qdrant-client")
    sys.exit(1)

RAG_DIR = Path(__file__).parent.parent
CHUNKS_DIR = RAG_DIR / "05_processados" / "chunks"

# Configuration
COLLECTION_NAME = "airops_documents"
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 1536
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6433"))
BATCH_SIZE = 50  # Embeddings per API call


TEST_MODE = "--test" in sys.argv


def get_openai_client() -> Optional[OpenAI]:
    """Create OpenAI client (returns None in test mode)."""
    if TEST_MODE:
        print("  [TEST MODE] Using random embeddings (no OpenAI API)")
        return None
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "sk-placeholder":
        print("ERROR: OPENAI_API_KEY not set or is placeholder.")
        print("  Use --test flag to run with random embeddings.")
        sys.exit(1)
    return OpenAI(api_key=api_key)


def get_qdrant_client() -> QdrantClient:
    """Create Qdrant client."""
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    # Test connection
    try:
        client.get_collections()
        print(f"  ✅ Connected to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
    except Exception as e:
        print(f"  ❌ Cannot connect to Qdrant: {e}")
        print(f"  Run: docker compose up -d")
        sys.exit(1)
    return client


def create_collection(qdrant: QdrantClient):
    """Create or recreate the Qdrant collection."""
    collections = [c.name for c in qdrant.get_collections().collections]

    if COLLECTION_NAME in collections:
        print(f"  Collection '{COLLECTION_NAME}' already exists. Recreating...")
        qdrant.delete_collection(COLLECTION_NAME)

    dim = 128 if TEST_MODE else EMBEDDING_DIMENSIONS
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=dim,
            distance=Distance.COSINE,
        ),
    )
    print(f"  ✅ Collection '{COLLECTION_NAME}' created ({dim}D, cosine)")


def generate_embeddings(openai_client: Optional[OpenAI], texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts."""
    if openai_client is None:  # Test mode
        dim = 128 if TEST_MODE else EMBEDDING_DIMENSIONS
        embeddings = []
        for text in texts:
            np.random.seed(hash(text[:100]) % (2**31))
            vec = np.random.randn(dim).astype(np.float32)
            vec = vec / np.linalg.norm(vec)
            embeddings.append(vec.tolist())
        return embeddings
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
        dimensions=EMBEDDING_DIMENSIONS,
    )
    return [item.embedding for item in response.data]


def load_all_chunks() -> list[dict]:
    """Load all chunk files from the chunks directory."""
    if not CHUNKS_DIR.exists():
        print("No chunks found. Run chunker.py first.")
        return []

    all_chunks = []
    for filepath in sorted(CHUNKS_DIR.glob("*.json")):
        with open(filepath, "r", encoding="utf-8") as f:
            chunks = json.load(f)
        all_chunks.extend(chunks)

    return all_chunks


def index_chunks(chunks: list[dict], openai_client: OpenAI, qdrant: QdrantClient):
    """Generate embeddings and index all chunks into Qdrant."""
    total = len(chunks)
    print(f"\n  Indexing {total} chunks...")

    points = []
    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        texts = [c["text"] for c in batch]

        # Generate embeddings
        try:
            embeddings = generate_embeddings(openai_client, texts)
        except Exception as e:
            print(f"  ❌ Embedding error at batch {i//BATCH_SIZE}: {e}")
            time.sleep(5)
            continue

        # Create Qdrant points
        for j, (chunk, embedding) in enumerate(zip(batch, embeddings)):
            point_id = i + j  # Sequential integer ID
            payload = {
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "document_name": chunk["document_name"],
                "source_type": chunk.get("source_type", ""),
                "authority": chunk.get("authority", ""),
                "legal_weight": chunk.get("legal_weight", ""),
                "topic": chunk.get("topic", ""),
                "subtopics": chunk.get("subtopics", []),
                "article": chunk.get("article"),
                "flight_scope": chunk.get("flight_scope", []),
                "business_scope": chunk.get("business_scope", []),
                "effective_from": chunk.get("effective_from"),
                "effective_to": chunk.get("effective_to"),
                "version": chunk.get("version", ""),
                "priority": chunk.get("priority", 3),
                "text": chunk["text"],
                "char_count": chunk.get("char_count", len(chunk["text"])),
                "split_method": chunk.get("split_method", ""),
            }

            points.append(PointStruct(
                id=point_id,
                vector=embedding,
                payload=payload,
            ))

        progress = min(i + BATCH_SIZE, total)
        print(f"  [{progress}/{total}] Embedded and prepared")

        # Rate limiting
        time.sleep(0.5)

    # Upsert all points
    if points:
        # Upsert in batches of 100
        for i in range(0, len(points), 100):
            batch = points[i:i + 100]
            qdrant.upsert(
                collection_name=COLLECTION_NAME,
                points=batch,
            )
        print(f"  ✅ Indexed {len(points)} points into '{COLLECTION_NAME}'")

    return len(points)


def verify_index(qdrant: QdrantClient):
    """Verify the index by running a test query."""
    collection_info = qdrant.get_collection(COLLECTION_NAME)
    print(f"\n  Collection stats:")
    print(f"    Points: {collection_info.points_count}")
    print(f"    Status: {collection_info.status}")


def run_indexing():
    """Run the full indexing pipeline."""
    print(f"\n{'='*60}")
    print(f"AirOps RAG — Embedding + Qdrant Indexing Pipeline")
    print(f"{'='*60}")

    # Load chunks
    chunks = load_all_chunks()
    if not chunks:
        return

    print(f"  Total chunks to index: {len(chunks)}")

    # Connect to services
    openai_client = get_openai_client()
    qdrant = get_qdrant_client()

    # Create collection
    create_collection(qdrant)

    # Index
    indexed = index_chunks(chunks, openai_client, qdrant)

    # Verify
    verify_index(qdrant)

    print(f"\n{'='*60}")
    print(f"Indexing complete. {indexed} chunks indexed.")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_indexing()
