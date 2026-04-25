# ==========================================
# AirOps AI — Groundedness Checker
# Verifies LLM responses against source chunks
# Anti-hallucination layer (Air Canada mitigation)
# ==========================================

import json
import os
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from config.config_loader import get_model_config, get_guardrail_config

GROUNDEDNESS_PROMPT = """
Você é um verificador de groundedness. Sua tarefa é verificar se a resposta gerada é suportada pelas fontes fornecidas.

## Fontes
{sources}

## Resposta a verificar
{answer}

## Instruções

Para CADA afirmação factual na resposta, classifique como:
- SUPORTADA: A afirmação é diretamente suportada pelas fontes
- PARCIALMENTE_SUPORTADA: A afirmação é parcialmente suportada (informação incompleta)
- NÃO_SUPORTADA: A afirmação NÃO tem base nas fontes fornecidas

## Atenção especial (BLOQUEAR se NÃO_SUPORTADA):
- Prazos (dias, horas, datas)
- Valores monetários (reembolso, indenização, multa)
- Artigos de lei ou regulação
- Direitos do passageiro
- Obrigações da companhia
- Compensações financeiras

## Formato de resposta (JSON):
{{
  "grounded": true/false,
  "overall_confidence": "alta/media/baixa",
  "claims": [
    {{
      "claim": "texto da afirmação",
      "classification": "SUPORTADA/PARCIALMENTE_SUPORTADA/NÃO_SUPORTADA",
      "source_chunk_id": "id do chunk que suporta (ou null)",
      "explanation": "breve explicação"
    }}
  ],
  "unsupported_claims": ["lista de afirmações não suportadas"],
  "should_block": true/false,
  "block_reason": "motivo do bloqueio (ou null)"
}}
""".strip()


def check_groundedness(
    answer: str,
    chunks: list[dict],
    strict_mode: bool = True,
) -> dict:
    """
    Verify if the answer is grounded in the provided chunks.

    Args:
        answer: The LLM-generated answer to verify
        chunks: List of source chunks used to generate the answer
        strict_mode: If True, blocks any unsupported claim about critical topics

    Returns:
        dict with grounded status, claims analysis, and blocking decision
    """
    if OpenAI is None:
        return {
            "grounded": True,
            "overall_confidence": "unknown",
            "claims": [],
            "unsupported_claims": [],
            "should_block": False,
            "block_reason": None,
            "checker_available": False,
        }

    # Format sources
    sources_text = "\n\n".join(
        f"[Chunk: {c.get('chunk_id', 'unknown')}]\n"
        f"Documento: {c.get('document_name', 'unknown')}\n"
        f"Artigo: {c.get('article', 'N/A')}\n"
        f"Texto: {c.get('text', '')}"
        for c in chunks
    )

    # Build the verification prompt
    prompt = GROUNDEDNESS_PROMPT.format(
        sources=sources_text,
        answer=answer,
    )

    # Use the fast model for groundedness (cost-efficient)
    try:
        model_config = get_model_config("text_fast")
    except (ValueError, FileNotFoundError):
        model_config = {"model": "gpt-4o-mini", "temperature": 0.0}

    # Call LLM
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        response = client.chat.completions.create(
            model=model_config.get("model", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "Você é um verificador de groundedness rigoroso."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=1000,
        )

        result = json.loads(response.choices[0].message.content)
    except Exception as e:
        # If groundedness check fails, block by default (safety-first)
        return {
            "grounded": False,
            "overall_confidence": "unknown",
            "claims": [],
            "unsupported_claims": [],
            "should_block": strict_mode,
            "block_reason": f"Groundedness check failed: {str(e)}",
            "checker_available": True,
        }

    # Apply strict mode: check guardrails config
    if strict_mode and result.get("unsupported_claims"):
        try:
            guardrail = get_guardrail_config("groundedness_required")
            block_on = guardrail.get("block_on", [])
        except (ValueError, FileNotFoundError):
            block_on = []

        # If any unsupported claim exists and strict mode is on, block
        if not result.get("should_block"):
            result["should_block"] = True
            result["block_reason"] = "Strict mode: unsupported claims detected"

    result["checker_available"] = True
    return result


def get_fallback_message() -> str:
    """Get the fallback message when groundedness check blocks a response."""
    try:
        guardrail = get_guardrail_config("groundedness_required")
        return guardrail.get(
            "fallback_message",
            "Não encontrei base suficiente nos documentos disponíveis para responder com segurança. Vou encaminhar para análise especializada."
        )
    except (ValueError, FileNotFoundError):
        return "Não encontrei base suficiente nos documentos disponíveis para responder com segurança. Vou encaminhar para análise especializada."
