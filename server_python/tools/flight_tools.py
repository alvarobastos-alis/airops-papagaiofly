# ==========================================
# AirOps AI — Flight Tools
# Function calling tools for flight operations
# ==========================================

FLIGHT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_flight_status",
            "description": "Consulta o status de um voo (horário, portão, atrasos, cancelamentos). Requer número do voo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "flight_number": {
                        "type": "string",
                        "description": "Número do voo (ex: OP1234)"
                    },
                    "date": {
                        "type": "string",
                        "description": "Data do voo no formato YYYY-MM-DD"
                    }
                },
                "required": ["flight_number"],
                "additionalProperties": False
            },
        }
    },
]
