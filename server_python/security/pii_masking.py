# ==========================================
# AirOps AI — Security: PII Masking (Layer 1)
# ==========================================

import re


PII_PATTERNS = {
    "cpf": re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"),
    "email": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "phone_br": re.compile(r"(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}"),
    "credit_card": re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"),
    "passport": re.compile(r"\b[A-Z]{2}\d{6,9}\b"),
    "birth_date": re.compile(r"\b\d{2}/\d{2}/\d{4}\b"),
}

MASK_MAP = {
    "cpf": "[CPF_REDACTED]",
    "email": "[EMAIL_REDACTED]",
    "phone_br": "[PHONE_REDACTED]",
    "credit_card": "[CC_REDACTED]",
    "passport": "[PASSPORT_REDACTED]",
    "birth_date": "[DOB_REDACTED]",
}


def mask_pii(text: str) -> dict:
    masked = text
    entities = []

    for pii_type, pattern in PII_PATTERNS.items():
        for match in pattern.finditer(text):
            mask_value = MASK_MAP.get(pii_type, f"[{pii_type.upper()}_REDACTED]")
            entities.append({
                "type": pii_type,
                "original": match.group(),
                "masked": mask_value,
                "startIndex": match.start(),
                "endIndex": match.end(),
            })
        masked = pattern.sub(MASK_MAP.get(pii_type, f"[{pii_type.upper()}_REDACTED]"), masked)

    return {"masked": masked, "entities": entities, "hasPII": len(entities) > 0}


def contains_pii(text: str) -> bool:
    for pattern in PII_PATTERNS.values():
        if pattern.search(text):
            return True
    return False
