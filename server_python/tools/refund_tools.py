# ==========================================
# AirOps AI — Refund Tools
# Function calling tools for refund operations
# ==========================================

REFUND_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_refund_options",
            "description": "Lista as opções de reembolso disponíveis para a reserva, baseado na tarifa e no motivo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pnr": {
                        "type": "string",
                        "description": "Código PNR da reserva"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Motivo do reembolso",
                        "enum": ["voluntary", "irop", "medical", "death", "duplicate", "no_show"]
                    }
                },
                "required": ["pnr", "reason"],
                "additionalProperties": False
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_refund",
            "description": "Cria uma solicitação de reembolso. Verificar regras tarifárias antes de criar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pnr": {
                        "type": "string",
                        "description": "Código PNR da reserva"
                    },
                    "refund_type": {
                        "type": "string",
                        "description": "Tipo de reembolso",
                        "enum": ["full", "partial", "credit"]
                    },
                    "reason": {
                        "type": "string",
                        "description": "Motivo do reembolso"
                    },
                    "amount": {
                        "type": "number",
                        "description": "Valor do reembolso (se parcial)"
                    }
                },
                "required": ["pnr", "refund_type", "reason"],
                "additionalProperties": False
            },
        }
    },
]
