# ==========================================
# AirOps AI — Text Normalizer
# Cleans extracted text and identifies legal structure
# ==========================================
#
# Usage:
#   python -m rag_aviacao.scripts.normalizer
#
# Input:  05_processados/extracted/*.json
# Output: 05_processados/normalized/*.json
# ==========================================

import json
import re
import sys
from pathlib import Path

RAG_DIR = Path(__file__).parent.parent
EXTRACTED_DIR = RAG_DIR / "05_processados" / "extracted"
NORMALIZED_DIR = RAG_DIR / "05_processados" / "normalized"


def clean_text(text: str) -> str:
    """Remove common PDF artifacts and normalize whitespace."""
    # Remove page numbers (standalone numbers on a line)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.MULTILINE)

    # Remove repeated dashes/underscores (visual separators)
    text = re.sub(r"[-_]{5,}", "", text)

    # Remove common PDF headers/footers
    text = re.sub(r"(?i)^(página|page)\s*\d+.*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"(?i)^.*diário oficial.*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"(?i)^.*www\.anac\.gov\.br.*$", "", text, flags=re.MULTILINE)

    # Normalize unicode characters
    text = text.replace("\u2013", "-")  # en-dash
    text = text.replace("\u2014", "-")  # em-dash
    text = text.replace("\u201c", '"')  # left double quote
    text = text.replace("\u201d", '"')  # right double quote
    text = text.replace("\u2018", "'")  # left single quote
    text = text.replace("\u2019", "'")  # right single quote
    text = text.replace("\u00a0", " ")  # non-breaking space
    text = text.replace("\u00ad", "")   # soft hyphen

    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


def identify_legal_structure(text: str) -> list[dict]:
    """Identify legal hierarchy elements in the text."""
    elements = []

    # Títulos
    for m in re.finditer(r"(?i)^(TÍTULO\s+[IVXLCDM]+)\s*[-–]?\s*(.*?)$", text, re.MULTILINE):
        elements.append({
            "type": "titulo",
            "label": m.group(1).strip(),
            "name": m.group(2).strip(),
            "position": m.start(),
        })

    # Capítulos
    for m in re.finditer(r"(?i)^(CAPÍTULO\s+[IVXLCDM]+)\s*[-–]?\s*(.*?)$", text, re.MULTILINE):
        elements.append({
            "type": "capitulo",
            "label": m.group(1).strip(),
            "name": m.group(2).strip(),
            "position": m.start(),
        })

    # Seções
    for m in re.finditer(r"(?i)^(Seção\s+[IVXLCDM]+)\s*[-–]?\s*(.*?)$", text, re.MULTILINE):
        elements.append({
            "type": "secao",
            "label": m.group(1).strip(),
            "name": m.group(2).strip(),
            "position": m.start(),
        })

    # Artigos
    for m in re.finditer(r"^(Art\.\s*\d+[°º]?\.?)\s*(.*?)$", text, re.MULTILINE):
        elements.append({
            "type": "artigo",
            "label": m.group(1).strip().rstrip("."),
            "text_start": m.group(2).strip()[:100],
            "position": m.start(),
        })

    # Parágrafos
    for m in re.finditer(r"^(§\s*\d+[°º]?\.?)\s*(.*?)$", text, re.MULTILINE):
        elements.append({
            "type": "paragrafo",
            "label": m.group(1).strip(),
            "text_start": m.group(2).strip()[:100],
            "position": m.start(),
        })

    # Sort by position
    elements.sort(key=lambda x: x["position"])
    return elements


def normalize_document(extracted_path: Path) -> dict:
    """Normalize an extracted document."""
    with open(extracted_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("status") == "file_not_found":
        return data

    print(f"  Normalizing: {data['document_name']}")

    # Combine all page texts
    full_text = "\n\n".join(
        page["text"] for page in data.get("pages", []) if page.get("text")
    )

    # Clean the text
    cleaned_text = clean_text(full_text)

    # Identify legal structure
    legal_structure = identify_legal_structure(cleaned_text)

    # Clean individual pages too
    normalized_pages = []
    for page in data.get("pages", []):
        cleaned_page = clean_text(page.get("text", ""))
        if cleaned_page:
            normalized_pages.append({
                "page": page["page"],
                "text": cleaned_page,
                "char_count": len(cleaned_page),
            })

    result = {
        "document_id": data["document_id"],
        "document_name": data["document_name"],
        "source_type": data.get("source_type", ""),
        "authority": data.get("authority", ""),
        "status": "normalized",
        "total_pages": len(normalized_pages),
        "total_chars": len(cleaned_text),
        "legal_elements_found": len(legal_structure),
        "legal_structure": legal_structure,
        "full_text": cleaned_text,
        "pages": normalized_pages,
        "tables": data.get("tables", []),
    }

    return result


def save_normalized(result: dict):
    """Save normalized result as JSON."""
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = NORMALIZED_DIR / f"{result['document_id']}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    legal_count = result.get("legal_elements_found", 0)
    print(f"  → Saved: {output_path.name} ({result['total_chars']} chars, {legal_count} legal elements)")


def run_normalization():
    """Run normalization for all extracted documents."""
    print(f"\n{'='*60}")
    print(f"AirOps RAG — Text Normalization Pipeline")
    print(f"{'='*60}")

    if not EXTRACTED_DIR.exists():
        print("No extracted files found. Run extractor.py first.")
        return

    extracted_files = sorted(EXTRACTED_DIR.glob("*.json"))
    print(f"Extracted files found: {len(extracted_files)}")
    print()

    for filepath in extracted_files:
        result = normalize_document(filepath)
        save_normalized(result)

    print(f"\n{'='*60}")
    print(f"Normalization complete.")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_normalization()
