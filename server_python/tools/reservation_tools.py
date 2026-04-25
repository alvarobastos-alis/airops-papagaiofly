# ==========================================
# AirOps AI — Reservation Tools
# Function calling tools for reservation operations
# ==========================================

RESERVATION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_reservation",
            "description": "Consulta detalhes de uma reserva pelo PNR e sobrenome. Requer autenticação.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pnr": {
                        "type": "string",
                        "description": "Código PNR (6 caracteres alfanuméricos, ex: ABC123)"
                    },
                    "last_name": {
                        "type": "string",
                        "description": "Sobrenome do passageiro"
                    }
                },
                "required": ["pnr", "last_name"],
                "additionalProperties": False
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "rebook_flight",
            "description": "Remarca o voo de uma reserva para outra data/horário. Aplica regras tarifárias.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pnr": {
                        "type": "string",
                        "description": "Código PNR da reserva"
                    },
                    "new_flight_number": {
                        "type": "string",
                        "description": "Número do novo voo"
                    },
                    "new_date": {
                        "type": "string",
                        "description": "Nova data no formato YYYY-MM-DD"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Motivo da remarcação",
                        "enum": ["voluntary", "irop", "medical", "death"]
                    }
                },
                "required": ["pnr", "new_flight_number", "new_date", "reason"],
                "additionalProperties": False
            },
        }
    },
]
