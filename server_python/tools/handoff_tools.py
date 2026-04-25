# ==========================================
# AirOps AI — Handoff Tools
# Function calling tools for human escalation
# ==========================================

HANDOFF_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_handoff",
            "description": "Transfere o atendimento para um agente humano. Usado quando o bot não pode resolver.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pnr": {
                        "type": "string",
                        "description": "Código PNR da reserva (se disponível)"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Motivo da transferência",
                        "enum": [
                            "refund_over_limit",
                            "identity_mismatch",
                            "fraud_risk_high",
                            "customer_angry",
                            "low_confidence",
                            "conflict_norm_vs_policy",
                            "repeated_failure",
                            "pnae_special_request",
                            "customer_requested"
                        ]
                    },
                    "context_summary": {
                        "type": "string",
                        "description": "Resumo do atendimento até o momento para o agente humano"
                    },
                    "priority": {
                        "type": "string",
                        "description": "Prioridade da transferência",
                        "enum": ["low", "normal", "high", "urgent"]
                    }
                },
                "required": ["reason", "context_summary"],
                "additionalProperties": False
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_rag",
            "description": "Busca informações sobre normas, regulações, direitos do passageiro e políticas internas no banco de conhecimento.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Pergunta ou tema a buscar no banco de conhecimento"
                    },
                    "topic": {
                        "type": "string",
                        "description": "Tema principal para filtrar a busca",
                        "enum": [
                            "direitos_passageiro",
                            "atraso_cancelamento",
                            "reembolso",
                            "bagagem",
                            "transporte_animais",
                            "acessibilidade",
                            "artigos_perigosos",
                            "documentacao",
                            "carga"
                        ]
                    },
                    "flight_scope": {
                        "type": "string",
                        "description": "Escopo do voo",
                        "enum": ["domestico", "internacional"]
                    }
                },
                "required": ["query"],
                "additionalProperties": False
            },
        }
    },
]
