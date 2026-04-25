# ==========================================
# AirOps AI — Voice API Route (WebRTC proxy stub)
# ==========================================

from fastapi import APIRouter
import httpx
from config.settings import settings
from services.openai_client import is_openai_available

router = APIRouter(prefix="/api/voice", tags=["Voice"])

@router.post("/session")
async def create_voice_session():
    """Create a WebRTC voice session by returning an ephemeral key."""
    if not is_openai_available():
        return {
            "status": "unavailable",
            "message": "Voice sessions require a valid OpenAI API key with Realtime API access.",
        }
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.OPENAI_REALTIME_MODEL,
                    "voice": settings.OPENAI_REALTIME_VOICE
                }
            )
            data = response.json()
            return {
                "status": "success",
                "client_secret": data.get("client_secret", {}).get("value"),
                "model": settings.OPENAI_REALTIME_MODEL,
                "voice": settings.OPENAI_REALTIME_VOICE
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

from pydantic import BaseModel
import json

class ToolExecuteRequest(BaseModel):
    toolName: str
    args: dict

@router.post("/tool-execute")
async def execute_voice_tool(body: ToolExecuteRequest):
    """Executes a tool requested by the Voice Agent."""
    from services.auth_engine import secure_pnr_lookup
    from services.rag import search_knowledge
    
    try:
        if body.toolName == "lookup_pnr":
            pnr = body.args.get("pnr")
            if not pnr:
                return {"result": json.dumps({"error": "Missing PNR"})}
            result = secure_pnr_lookup(pnr)
            return {"result": json.dumps(result)}
            
        elif body.toolName == "search_knowledge":
            query = body.args.get("query", "")
            result = await search_knowledge(query)
            return {"result": result}
            
        elif body.toolName == "escalate_to_human":
            reason = body.args.get("reason", "")
            score = body.args.get("sentiment_score", 0)
            print(f"Call escalated: {reason} (Sentiment: {score}/10)")
            return {"result": json.dumps({"status": "transferring", "instruction": "Diga ao cliente que entende a frustração e que vai transferir imediatamente para um especialista humano."})}
            
        else:
            return {"result": json.dumps({"error": f"Unknown tool: {body.toolName}"})}
            
    except Exception as e:
        return {"result": json.dumps({"error": str(e)})}
