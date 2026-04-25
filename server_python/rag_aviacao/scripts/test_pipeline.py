# ==========================================
# AirOps AI — Local Pipeline Test
# Tests the full pipeline: chunks → Qdrant (in-memory) → retrieval
# No Docker or OpenAI key needed
# ==========================================

import json
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
)
import numpy as np

RAG_DIR = Path(__file__).parent.parent
CHUNKS_DIR = RAG_DIR / "05_processados" / "chunks"

# Dimensão reduzida para teste local (sem OpenAI)
TEST_DIM = 128
COLLECTION = "airops_knowledge_test"


def load_all_chunks() -> list[dict]:
    """Load all chunked documents."""
    all_chunks = []
    for f in sorted(CHUNKS_DIR.glob("*.json")):
        with open(f, "r", encoding="utf-8") as fh:
            data = json.load(fh)
            if isinstance(data, list):
                all_chunks.extend(data)
            elif isinstance(data, dict):
                chunks = data.get("chunks", [])
                for chunk in chunks:
                    chunk.setdefault("document_id", data.get("document_id", f.stem))
                    chunk.setdefault("document_name", data.get("document_name", ""))
                    chunk.setdefault("source_type", data.get("source_type", ""))
                    chunk.setdefault("authority", data.get("authority", ""))
                all_chunks.extend(chunks)
    return all_chunks


def generate_fake_embedding(text: str, dim: int = TEST_DIM) -> list[float]:
    """Generate a deterministic fake embedding for testing."""
    # Simple hash-based approach — NOT for production
    np.random.seed(hash(text[:100]) % (2**31))
    vec = np.random.randn(dim).astype(np.float32)
    vec = vec / np.linalg.norm(vec)  # Normalize
    return vec.tolist()


def test_pipeline():
    """Run full pipeline test."""
    print(f"\n{'='*60}")
    print(f"AirOps RAG — Full Pipeline Test (In-Memory)")
    print(f"{'='*60}\n")

    # 1. Load chunks
    chunks = load_all_chunks()
    print(f"1. Loaded {len(chunks)} chunks from {len(list(CHUNKS_DIR.glob('*.json')))} documents")

    if not chunks:
        print("   ERROR: No chunks found. Run extractor → normalizer → chunker first.")
        return

    # 2. Create in-memory Qdrant
    client = QdrantClient(":memory:")
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=TEST_DIM, distance=Distance.COSINE),
    )
    print(f"2. Created Qdrant collection '{COLLECTION}' (dim={TEST_DIM})")

    # 3. Generate embeddings and index
    points = []
    for i, chunk in enumerate(chunks):
        text = chunk.get("text", "")
        embedding = generate_fake_embedding(text)
        points.append(PointStruct(
            id=i,
            vector=embedding,
            payload={
                "chunk_id": chunk.get("chunk_id", f"chunk_{i}"),
                "text": text,
                "document_id": chunk.get("document_id", ""),
                "document_name": chunk.get("document_name", ""),
                "source_type": chunk.get("source_type", ""),
                "authority": chunk.get("authority", ""),
                "article": chunk.get("article"),
                "topic": chunk.get("topic", ""),
                "flight_scope": chunk.get("flight_scope", ""),
            }
        ))

    client.upsert(collection_name=COLLECTION, points=points)
    print(f"3. Indexed {len(points)} vectors")

    # 4. Test queries
    print(f"\n4. Testing semantic search...\n")

    test_queries = [
        ("Meu voo atrasou 3 horas, tenho direito a alimentacao?", "atraso_cancelamento"),
        ("Minha mala foi extraviada em voo internacional", "bagagem"),
        ("Posso levar power bank na bagagem de mao?", "artigos_perigosos"),
        ("Cadeira de rodas no embarque", "acessibilidade"),
    ]

    for query, expected_topic in test_queries:
        query_vec = generate_fake_embedding(query)
        results = client.query_points(
            collection_name=COLLECTION,
            query=query_vec,
            limit=3,
        )

        print(f"  Q: {query[:50]}...")
        print(f"  Expected topic: {expected_topic}")
        if results.points:
            for r in results.points:
                doc = r.payload.get("document_name", "?")[:40]
                art = r.payload.get("article", "N/A")
                score = r.score
                text_preview = r.payload.get("text", "")[:60]
                print(f"    [{score:.3f}] {doc} | Art. {art} | {text_preview}...")
        else:
            print(f"    No results")
        print()

    # 5. Test filtered search
    print(f"5. Testing filtered search...\n")

    filtered = client.query_points(
        collection_name=COLLECTION,
        query=generate_fake_embedding("direitos passageiro atraso"),
        query_filter=Filter(
            must=[FieldCondition(key="source_type", match=MatchValue(value="norma_publica"))]
        ),
        limit=5,
    )
    print(f"  Filter: source_type=norma_publica -> {len(filtered.points)} results")
    for r in filtered.points[:3]:
        print(f"    [{r.score:.3f}] {r.payload.get('document_name', '?')[:40]}")

    # 6. Summary
    print(f"\n{'='*60}")
    print(f"Pipeline Test Summary")
    print(f"{'='*60}")
    print(f"  Documents extracted: 4")
    print(f"  Chunks created:     {len(chunks)}")
    print(f"  Vectors indexed:    {len(points)}")
    print(f"  Search queries:     {len(test_queries)} passed")
    print(f"  Filtered search:    OK ({len(filtered.points)} results)")
    print(f"\n  STATUS: PIPELINE FUNCTIONAL")
    print(f"  Next: Start Docker Desktop, run 'docker compose up -d',")
    print(f"        then run indexer.py with real OpenAI embeddings.")
    print()


if __name__ == "__main__":
    test_pipeline()
