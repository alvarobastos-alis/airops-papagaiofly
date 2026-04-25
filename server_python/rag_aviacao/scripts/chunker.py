# ==========================================
# AirOps AI — Intelligent Chunker
# Splits documents respecting legal boundaries
# ==========================================
#
# Usage:
#   python -m rag_aviacao.scripts.chunker
#
# Input:  05_processados/normalized/*.json
# Output: 05_processados/chunks/*.json
# ==========================================

import json
import re
import hashlib
import sys
from pathlib import Path
from typing import Optional

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    RecursiveCharacterTextSplitter = None
    print("[WARN] langchain-text-splitters not installed. Using fallback splitter.")

RAG_DIR = Path(__file__).parent.parent
NORMALIZED_DIR = RAG_DIR / "05_processados" / "normalized"
CHUNKS_DIR = RAG_DIR / "05_processados" / "chunks"
MANIFEST_PATH = RAG_DIR / "manifest.json"


def load_manifest() -> dict:
    """Load manifest indexed by document_id."""
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        docs = json.load(f)
    return {d["document_id"]: d for d in docs}


def generate_chunk_id(document_id: str, index: int, text: str) -> str:
    """Generate a deterministic chunk ID."""
    content_hash = hashlib.md5(text[:200].encode("utf-8")).hexdigest()[:8]
    return f"{document_id}_chunk_{index:04d}_{content_hash}"


def split_by_articles(text: str) -> list[dict]:
    """Split legal text by articles (Art. N)."""
    # Pattern matches: Art. 1, Art. 1°, Art. 1º, Art. 10.
    pattern = r"(?=(?:^|\n)\s*Art\.\s*\d+)"
    raw_chunks = re.split(pattern, text)

    chunks = []
    for raw in raw_chunks:
        raw = raw.strip()
        if not raw or len(raw) < 20:
            continue

        # Extract article number
        art_match = re.match(r"Art\.\s*(\d+)", raw)
        article = f"Art. {art_match.group(1)}" if art_match else None

        chunks.append({
            "text": raw,
            "article": article,
            "split_method": "article_boundary",
        })

    return chunks


def split_generic(text: str, chunk_size: int = 1200, chunk_overlap: int = 150) -> list[dict]:
    """Split non-legal text using recursive character splitter."""
    if RecursiveCharacterTextSplitter:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        texts = splitter.split_text(text)
    else:
        # Fallback: simple split by paragraphs
        paragraphs = text.split("\n\n")
        texts = []
        current = ""
        for para in paragraphs:
            if len(current) + len(para) > chunk_size:
                if current:
                    texts.append(current.strip())
                current = para
            else:
                current += "\n\n" + para if current else para
        if current:
            texts.append(current.strip())

    return [
        {"text": t, "article": None, "split_method": "recursive_character"}
        for t in texts if t.strip()
    ]


def chunk_document(normalized_path: Path, manifest_entry: dict) -> list[dict]:
    """Chunk a single normalized document."""
    with open(normalized_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("status") == "file_not_found":
        return []

    document_id = data["document_id"]
    full_text = data.get("full_text", "")
    source_type = manifest_entry.get("tipo", "")

    print(f"  Chunking: {data['document_name']} ({len(full_text)} chars)")

    # Choose strategy based on document type
    is_legal = source_type == "norma_publica" and data.get("legal_elements_found", 0) > 0
    has_articles = bool(re.search(r"Art\.\s*\d+", full_text))

    if is_legal and has_articles:
        raw_chunks = split_by_articles(full_text)
        print(f"    Strategy: article_boundary ({len(raw_chunks)} chunks)")
    else:
        raw_chunks = split_generic(full_text)
        print(f"    Strategy: recursive_character ({len(raw_chunks)} chunks)")

    # Also chunk tables as separate entries
    table_chunks = []
    for table in data.get("tables", []):
        if table.get("rows"):
            headers = table.get("headers", [])
            rows_text = "\n".join(
                " | ".join(str(cell or "") for cell in row)
                for row in table["rows"]
            )
            header_text = " | ".join(str(h or "") for h in headers) if headers else ""
            table_text = f"[TABELA - Página {table['page']}]\n{header_text}\n{rows_text}"

            table_chunks.append({
                "text": table_text,
                "article": None,
                "split_method": "table_extraction",
                "page": table["page"],
            })

    all_raw = raw_chunks + table_chunks

    # Enrich each chunk with metadata from manifest
    chunks = []
    for idx, raw in enumerate(all_raw):
        chunk_id = generate_chunk_id(document_id, idx, raw["text"])

        chunk = {
            "chunk_id": chunk_id,
            "document_id": document_id,
            "document_name": data["document_name"],
            "source_type": manifest_entry.get("tipo", ""),
            "authority": manifest_entry.get("autoridade", ""),
            "legal_weight": manifest_entry.get("legal_weight", ""),
            "topic": manifest_entry.get("tema_principal", ""),
            "subtopics": manifest_entry.get("subtemas", []),
            "article": raw.get("article"),
            "flight_scope": manifest_entry.get("flight_scope", []),
            "business_scope": manifest_entry.get("business_scope", []),
            "effective_from": manifest_entry.get("vigencia_inicio"),
            "effective_to": manifest_entry.get("vigencia_fim"),
            "version": manifest_entry.get("versao", ""),
            "priority": manifest_entry.get("prioridade", 3),
            "text": raw["text"],
            "char_count": len(raw["text"]),
            "split_method": raw.get("split_method", ""),
            "chunk_index": idx,
            "total_chunks": len(all_raw),
        }

        chunks.append(chunk)

    return chunks


def save_chunks(document_id: str, chunks: list[dict]):
    """Save chunks as JSON."""
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = CHUNKS_DIR / f"{document_id}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"  → Saved: {output_path.name} ({len(chunks)} chunks)")


def run_chunking():
    """Run chunking for all normalized documents."""
    print(f"\n{'='*60}")
    print(f"AirOps RAG — Intelligent Chunking Pipeline")
    print(f"{'='*60}")

    manifest = load_manifest()

    if not NORMALIZED_DIR.exists():
        print("No normalized files found. Run normalizer.py first.")
        return

    normalized_files = sorted(NORMALIZED_DIR.glob("*.json"))
    print(f"Normalized files found: {len(normalized_files)}")
    print()

    total_chunks = 0
    for filepath in normalized_files:
        doc_id = filepath.stem
        manifest_entry = manifest.get(doc_id, {})

        if not manifest_entry:
            print(f"  [WARN] {doc_id} not found in manifest, using defaults")
            manifest_entry = {"document_id": doc_id, "tipo": "unknown"}

        chunks = chunk_document(filepath, manifest_entry)
        if chunks:
            save_chunks(doc_id, chunks)
            total_chunks += len(chunks)

    print(f"\n{'='*60}")
    print(f"Chunking complete. Total chunks: {total_chunks}")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_chunking()
