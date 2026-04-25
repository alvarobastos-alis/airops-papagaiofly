from fastapi import APIRouter
from pydantic import BaseModel
import time
import uuid
from typing import List, Dict, Any

router = APIRouter(
    prefix="/api/sac",
    tags=["sac"]
)

def get_past_date(seconds_ago: int) -> str:
    from datetime import datetime, timedelta, timezone
    # Z at the end to match JS ISOString
    dt = datetime.now(timezone.utc) - timedelta(seconds=seconds_ago)
    return dt.isoformat().replace('+00:00', 'Z')

MOCK_ACTIVE_CALLS = [
  {
    "id": str(uuid.uuid4()),
    "pnr": 'DEMO11',
    "customerName": 'Roberto Gomes',
    "status": 'ai_handling',
    "startedAt": get_past_date(145), # 2m 25s
    "satisfactionScore": 65,
    "currentNode": 'Identificando cenário de Força Maior (Chuva)',
    "channel": 'voice',
    "agentId": 'Agente IA (Zulu)',
  },
  {
    "id": str(uuid.uuid4()),
    "pnr": 'DEMO12',
    "customerName": 'Camila Souza',
    "status": 'human_handling',
    "startedAt": get_past_date(610), # 10m 10s
    "satisfactionScore": 35,
    "currentNode": 'Atendimento Humanizado (Crise)',
    "channel": 'voice',
    "agentId": 'Operador Humano (Fernanda)',
  },
  {
    "id": str(uuid.uuid4()),
    "pnr": 'DEMO15',
    "customerName": 'Lucas Martins',
    "status": 'waiting_human',
    "startedAt": get_past_date(320), # 5m 20s
    "satisfactionScore": 42,
    "currentNode": 'Aguardando Transbordo (Greve)',
    "channel": 'chat',
    "agentId": 'Fila Nível 2',
  },
  {
    "id": str(uuid.uuid4()),
    "pnr": 'DEMO17',
    "customerName": 'Ricardo Alves',
    "status": 'ai_handling',
    "startedAt": get_past_date(45), # 45s
    "satisfactionScore": 88,
    "currentNode": 'Oferecendo FoodPass e Reacomodação',
    "channel": 'chat',
    "agentId": 'Agente IA (Zulu)',
  },
  {
    "id": str(uuid.uuid4()),
    "pnr": 'DEMO19',
    "customerName": 'Bruno Teixeira',
    "status": 'waiting_human',
    "startedAt": get_past_date(480), # 8m
    "satisfactionScore": 12,
    "currentNode": 'Passageiro Indisciplinado (Escalonamento VIP)',
    "channel": 'voice',
    "agentId": 'Fila Nível 3 (Segurança)',
  },
  {
    "id": str(uuid.uuid4()),
    "pnr": 'DEMO23',
    "customerName": 'Letícia Silva',
    "status": 'human_handling',
    "startedAt": get_past_date(1250), # ~20m
    "satisfactionScore": 95,
    "currentNode": 'MedAssist Acionado (Parto a Bordo)',
    "channel": 'voice',
    "agentId": 'Operador Especializado (Carlos)',
  }
]

import random

@router.get("/live-queue")
def get_live_queue():
    global MOCK_ACTIVE_CALLS
    # Randomly fluctuate satisfaction
    for call in MOCK_ACTIVE_CALLS:
        score = call["satisfactionScore"] + random.randint(-2, 2)
        call["satisfactionScore"] = max(0, min(100, score))
        
    active_count = sum(1 for c in MOCK_ACTIVE_CALLS if c["status"] in ('ai_handling', 'human_handling'))
    waiting_count = sum(1 for c in MOCK_ACTIVE_CALLS if c["status"] == 'waiting_human')
    
    from datetime import datetime
    now_ts = datetime.now().timestamp()
    
    def parse_iso(iso_str):
        if iso_str.endswith('Z'):
            iso_str = iso_str[:-1] + '+00:00'
        return datetime.fromisoformat(iso_str).timestamp()
    
    total_seconds = sum(int(now_ts - parse_iso(c["startedAt"])) for c in MOCK_ACTIVE_CALLS)
    avg_duration = total_seconds // len(MOCK_ACTIVE_CALLS) if MOCK_ACTIVE_CALLS else 0
    avg_satisfaction = sum(c["satisfactionScore"] for c in MOCK_ACTIVE_CALLS) // len(MOCK_ACTIVE_CALLS) if MOCK_ACTIVE_CALLS else 0

    return {
        "metrics": {
            "activeCalls": active_count,
            "waitingCalls": waiting_count,
            "avgDurationSeconds": avg_duration,
            "avgSatisfactionScore": avg_satisfaction
        },
        "calls": MOCK_ACTIVE_CALLS
    }
