# ==========================================
# AirOps AI — Security: Output Guardrails (Layer 3)
# ==========================================

import re
from typing import Dict, Any
from security.pii_masking import contains_pii

def mask_output_pii(text: str) -> str:
    """Guardrail 3: Ensure sensitive data is never output fully."""
    # Mask CPF-like structures
    text = re.sub(r'(\d{3})\.\d{3}\.\d{3}-(\d{2})', r'***.***.***-\2', text)
    # Mask Emails
    text = re.sub(r'([a-zA-Z0-9_.+-]{2})[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', r'\1***@***.***', text)
    # Mask Phones
    text = re.sub(r'(\+55\s*)?(\d{2})?\s*9\d{4}-?(\d{4})', r'\1\2 9****-\3', text)
    return text

OFFENSIVE_PATTERNS = [
    re.compile(r"\b(idiota|imbecil|estúpido|burro|cala\s*a?\s*boca)\b", re.I),
    re.compile(r"\b(merda|porra|caralho|f[ou]da-?se)\b", re.I),
]

COMPETITOR_PATTERNS = [
    re.compile(r"\b(latam|gol|azul|avianca|tap|american|delta|united)\b", re.I),
]

LEGAL_RISK_PATTERNS = [
    re.compile(r"\b(garanto|prometo|100%\s*certo|com\s*certeza\s*absoluta)\b", re.I),
    re.compile(r"\b(processo|advogado|tribunal|indenização\s*de\s*R?\$\s*\d{4,})\b", re.I),
    re.compile(r"\b(n[aã]o\s+tem\s+direito|voc[eê]\s+n[aã]o\s+pode)\b", re.I),
]

HALLUCINATION_PATTERNS = [
    re.compile(r"\bvoo\s+[A-Z]{2}\d{5,}\b", re.I),
    re.compile(r"\bR\$\s*\d{6,}\b"),
    re.compile(r"\b(2030|2029|2028)\b"),
]


def validate_output(output: str) -> dict:
    violations = []

    if contains_pii(output):
        violations.append({"rule": "pii-leak", "severity": "critical", "description": "Response contains PII that should not be exposed"})

    for pattern in OFFENSIVE_PATTERNS:
        m = pattern.search(output)
        if m:
            violations.append({"rule": "offensive-content", "severity": "high", "description": "Response contains offensive language", "match": m.group()})

    for pattern in COMPETITOR_PATTERNS:
        m = pattern.search(output)
        if m:
            violations.append({"rule": "competitor-mention", "severity": "low", "description": "Response mentions a competitor airline", "match": m.group()})

    for pattern in LEGAL_RISK_PATTERNS:
        m = pattern.search(output)
        if m:
            violations.append({"rule": "legal-risk", "severity": "medium", "description": "Response contains legally risky language", "match": m.group()})

    for pattern in HALLUCINATION_PATTERNS:
        m = pattern.search(output)
        if m:
            violations.append({"rule": "possible-hallucination", "severity": "high", "description": "Response may contain hallucinated information", "match": m.group()})

    if len(output) > 2000:
        violations.append({"rule": "response-too-long", "severity": "low", "description": "Response exceeds recommended length"})

    high_violations = [v for v in violations if v["severity"] in ("critical", "high")]
    sanitized = _sanitize(output, violations) if violations else output

    return {"passed": len(high_violations) == 0, "violations": violations, "sanitizedOutput": sanitized}


def _sanitize(output: str, violations: list) -> str:
    sanitized = output
    for v in violations:
        match = v.get("match")
        if not match:
            continue
        if v["rule"] == "offensive-content":
            sanitized = re.sub(re.escape(match), "***", sanitized, flags=re.I)
        elif v["rule"] == "competitor-mention":
            sanitized = re.sub(re.escape(match), "outra companhia", sanitized, flags=re.I)
    return sanitized
