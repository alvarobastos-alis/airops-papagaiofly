# ==========================================
# AirOps AI — PDF Text Extractor
# Extracts text and tables from PDF documents
# ==========================================
#
# Usage:
#   python -m rag_aviacao.scripts.extractor
#   python -m rag_aviacao.scripts.extractor --file path/to/specific.pdf
#
# Output: JSON files in 05_processados/extracted/
# ==========================================

import json
import sys
from pathlib import Path
from typing import Optional

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed. Run: pip install PyMuPDF")
    sys.exit(1)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None
    print("[WARN] pdfplumber not installed. Table extraction disabled. Run: pip install pdfplumber")

RAG_DIR = Path(__file__).parent.parent
EXTRACTED_DIR = RAG_DIR / "05_processados" / "extracted"
MANIFEST_PATH = RAG_DIR / "manifest.json"


def load_manifest() -> list[dict]:
    """Load the document manifest."""
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_text_pymupdf(pdf_path: Path) -> list[dict]:
    """Extract text from each page using PyMuPDF (fast, works for most PDFs)."""
    doc = fitz.open(str(pdf_path))
    pages = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")

        # Detect if page is likely scanned (very little text)
        is_scanned = len(text.strip()) < 50 and page.get_images()

        pages.append({
            "page": page_num + 1,
            "text": text.strip(),
            "char_count": len(text.strip()),
            "is_scanned": is_scanned,
            "has_images": bool(page.get_images()),
        })

    doc.close()
    return pages


def extract_tables_pdfplumber(pdf_path: Path) -> list[dict]:
    """Extract tables from PDF pages using pdfplumber."""
    if pdfplumber is None:
        return []

    tables = []
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_tables = page.extract_tables()
                for table_idx, table in enumerate(page_tables):
                    if table and len(table) > 1:
                        # First row as headers, rest as data
                        headers = table[0] if table[0] else []
                        rows = table[1:]
                        tables.append({
                            "page": page_num,
                            "table_index": table_idx,
                            "headers": headers,
                            "rows": rows,
                            "row_count": len(rows),
                        })
    except Exception as e:
        print(f"  [WARN] Table extraction failed: {e}")

    return tables


def extract_text_file(txt_path: Path) -> list[dict]:
    """Extract text from a plain text file (used for samples)."""
    text = txt_path.read_text(encoding="utf-8")
    return [{
        "page": 1,
        "text": text.strip(),
        "char_count": len(text.strip()),
        "is_scanned": False,
        "has_images": False,
    }]


def extract_document(doc_entry: dict, base_dir: Path) -> dict:
    """Extract text and tables from a single document (PDF or TXT)."""
    # Support both 'arquivo_pdf' (new) and 'arquivo' (legacy) keys
    arquivo = doc_entry.get("arquivo_pdf") or doc_entry.get("arquivo", "")
    file_path = (base_dir / arquivo).resolve()

    if not file_path.exists():
        return {
            "document_id": doc_entry["document_id"],
            "status": "file_not_found",
            "file_path": str(file_path),
            "pages": [],
            "tables": [],
        }

    file_size_mb = file_path.stat().st_size / (1024 * 1024)
    print(f"  Extracting: {doc_entry['nome']} ({file_path.name}, {file_size_mb:.1f} MB)")

    # Choose extraction method based on file extension
    if file_path.suffix.lower() == ".txt":
        pages = extract_text_file(file_path)
        tables = []
    else:
        pages = extract_text_pymupdf(file_path)
        # Only extract tables for smaller PDFs (pdfplumber is slow on huge files)
        if file_size_mb < 50:
            tables = extract_tables_pdfplumber(file_path)
        else:
            print(f"    [INFO] Skipping table extraction for large PDF ({file_size_mb:.0f} MB)")
            tables = []

    # Compute stats
    total_chars = sum(p["char_count"] for p in pages)
    scanned_pages = sum(1 for p in pages if p["is_scanned"])

    result = {
        "document_id": doc_entry["document_id"],
        "document_name": doc_entry["nome"],
        "source_type": doc_entry["tipo"],
        "authority": doc_entry["autoridade"],
        "status": "extracted",
        "file_path": str(file_path),
        "total_pages": len(pages),
        "total_chars": total_chars,
        "scanned_pages": scanned_pages,
        "needs_ocr": scanned_pages > 0,
        "table_count": len(tables),
        "pages": pages,
        "tables": tables,
    }

    return result


def save_extraction(result: dict):
    """Save extraction result as JSON."""
    if result.get("status") == "file_not_found":
        return
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = EXTRACTED_DIR / f"{result['document_id']}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  -> Saved: {output_path.name} ({result.get('total_pages', 0)} pages, {result.get('total_chars', 0)} chars)")


def run_extraction(specific_file: Optional[str] = None):
    """Run extraction for all documents in manifest or a specific file."""
    manifest = load_manifest()
    base_dir = RAG_DIR

    print(f"\n{'='*60}")
    print(f"AirOps RAG — PDF Extraction Pipeline")
    print(f"{'='*60}")
    print(f"Documents in manifest: {len(manifest)}")
    print(f"Output directory: {EXTRACTED_DIR}")
    print()

    results_summary = []

    for doc_entry in manifest:
        if specific_file and doc_entry["document_id"] != specific_file:
            continue

        result = extract_document(doc_entry, base_dir)
        save_extraction(result)

        results_summary.append({
            "document_id": result["document_id"],
            "status": result["status"],
            "pages": result.get("total_pages", 0),
            "chars": result.get("total_chars", 0),
            "needs_ocr": result.get("needs_ocr", False),
            "tables": result.get("table_count", 0),
        })

    # Print summary
    print(f"\n{'='*60}")
    print(f"Extraction Summary")
    print(f"{'='*60}")
    for r in results_summary:
        status_icon = "✅" if r["status"] == "extracted" else "❌"
        ocr_flag = " [OCR needed]" if r.get("needs_ocr") else ""
        table_info = f" [{r['tables']} tables]" if r.get("tables") else ""
        print(f"  {status_icon} {r['document_id']}: {r['pages']} pages, {r['chars']} chars{table_info}{ocr_flag}")

    extracted = sum(1 for r in results_summary if r["status"] == "extracted")
    missing = sum(1 for r in results_summary if r["status"] == "file_not_found")
    ocr_needed = sum(1 for r in results_summary if r.get("needs_ocr"))

    print(f"\n  Total: {extracted} extracted, {missing} missing, {ocr_needed} need OCR")


if __name__ == "__main__":
    file_arg = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "--file" else None
    if "--file" in sys.argv:
        idx = sys.argv.index("--file")
        file_arg = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None
    run_extraction(file_arg)
