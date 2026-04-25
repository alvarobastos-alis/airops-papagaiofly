# ==========================================
# AirOps AI — Conflict Resolver
# Detects and resolves norm vs policy conflicts
# ==========================================

from typing import Optional


def check_conflicts(chunks: list[dict]) -> dict:
    """
    Check if retrieved chunks contain conflicting sources.
    E.g., public law says X but internal policy says Y.
    
    Priority: norma_publica > politica_interna > faq > tabela_operacional
    """
    if not chunks or len(chunks) < 2:
        return {"conflict_detected": False}

    SOURCE_PRIORITY = {
        "norma_publica": 1,
        "politica_interna": 2,
        "faq": 3,
        "tabela_operacional": 4,
    }

    # Separate by source type
    norms = [c for c in chunks if c.get("source_type") == "norma_publica"]
    policies = [c for c in chunks if c.get("source_type") == "politica_interna"]

    if not norms or not policies:
        return {"conflict_detected": False}

    # Check if norm and policy address same topic but different legal weights
    norm_topics = {c.get("topic") for c in norms}
    policy_topics = {c.get("topic") for c in policies}
    overlapping_topics = norm_topics & policy_topics

    if not overlapping_topics:
        return {"conflict_detected": False}

    # Potential conflict found
    return {
        "conflict_detected": True,
        "overlapping_topics": list(overlapping_topics),
        "norm_sources": [
            {"document": c.get("document_name"), "article": c.get("article"), "authority": c.get("authority")}
            for c in norms
        ],
        "policy_sources": [
            {"document": c.get("document_name"), "authority": c.get("authority")}
            for c in policies
        ],
        "resolution": "norma_publica_prevalece",
        "recommendation": "Escalonar para análise jurídica. Norma pública prevalece sobre política interna.",
        "should_escalate": True,
    }


def resolve_conflict(conflict: dict) -> dict:
    """
    Resolve a detected conflict by applying priority rules.
    Always: public norm > internal policy.
    """
    if not conflict.get("conflict_detected"):
        return {"resolved": True, "action": "no_conflict"}

    return {
        "resolved": True,
        "action": "prioritize_public_norm",
        "primary_sources": conflict.get("norm_sources", []),
        "secondary_sources": conflict.get("policy_sources", []),
        "warning": "Conflito detectado entre norma pública e política interna. Norma pública aplicada.",
        "escalation_recommended": conflict.get("should_escalate", True),
    }
