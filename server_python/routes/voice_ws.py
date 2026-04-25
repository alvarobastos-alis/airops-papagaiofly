# ==========================================
# AirOps AI — Voice WebRTC WebSocket Relay
# Proxy between Client and OpenAI Realtime API
# ==========================================

import os
import json
import asyncio
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from config.settings import settings
from services.openai_client import is_openai_available

router = APIRouter(prefix="/api/voice", tags=["Voice WS"])

OPENAI_WS_URL = "wss://api.openai.com/v1/realtime?model=" + settings.OPENAI_REALTIME_MODEL

@router.websocket("/ws")
async def voice_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    if not is_openai_available():
        await websocket.send_json({"type": "error", "message": "OpenAI API Key is required for Realtime voice sessions."})
        await websocket.close()
        return

    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "OpenAI-Beta": "realtime=v1"
    }

    try:
        async with websockets.connect(OPENAI_WS_URL, extra_headers=headers) as openai_ws:
            
            # Init session config
            await openai_ws.send(json.dumps({
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "voice": settings.OPENAI_REALTIME_VOICE,
                    "instructions": "Você é a Zulu, assistente de voz da Papagaio Fly. Você REPRESENTA a companhia aérea diretamente. NUNCA diga 'vou encaminhar para a companhia'. Após receber o PNR, peça o sobrenome do passageiro antes de mostrar dados. Seja simpática e acolhedora. Fale em Português Brasileiro.",
                    "input_audio_transcription": {"model": "whisper-1"}
                }
            }))

            async def client_to_openai():
                try:
                    while True:
                        data = await websocket.receive_text()
                        await openai_ws.send(data)
                except WebSocketDisconnect:
                    pass

            async def openai_to_client():
                try:
                    while True:
                        data = await openai_ws.recv()
                        await websocket.send_text(data)
                except websockets.exceptions.ConnectionClosed:
                    pass

            await asyncio.gather(
                client_to_openai(),
                openai_to_client()
            )

    except Exception as e:
        print(f"Voice WS Error: {e}")
        try:
            await websocket.close()
        except:
            pass
