# ==========================================
# AirOps AI — Voice Front Agent
# Server-side pipeline: STT → RAG → TTS
# ==========================================

import os
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from config.config_loader import (
    get_agent_config,
    load_voice_config,
)
from agents.sac_orchestrator import orchestrate
from services.rag_pipeline import classify_intent

AGENT_NAME = "voice_front_agent"


async def process_voice_turn(
    audio_data: bytes,
    session: Optional[dict] = None,
    conversation_history: Optional[list] = None,
) -> dict:
    """
    Process a single voice turn: STT → Orchestrate → TTS.
    
    Returns dict with 'audio' (bytes), 'transcript', 'response_text'.
    """
    session = session or {}
    voice_config = load_voice_config()

    if OpenAI is None:
        return {"error": "OpenAI not available", "response_text": voice_config.get("fallback", {}).get("on_pipeline_error", "")}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # 1. STT — Transcribe audio
    stt_config = voice_config.get("stt", {})
    try:
        transcript_response = client.audio.transcriptions.create(
            model=stt_config.get("model", "gpt-4o-transcribe"),
            file=("audio.webm", audio_data, "audio/webm"),
            language=stt_config.get("language", "pt"),
            prompt=stt_config.get("prompt", ""),
        )
        transcript = transcript_response.text
    except Exception as e:
        fallback = voice_config.get("fallback", {}).get("on_stt_failure", "Não entendi. Poderia repetir?")
        return {"transcript": "", "response_text": fallback, "error": f"STT failed: {e}"}

    if not transcript or not transcript.strip():
        return {"transcript": "", "response_text": "Não captei nenhuma fala. Poderia repetir?"}

    # 2. Orchestrate — same pipeline as chat
    result = await orchestrate(
        message=transcript,
        session=session,
        conversation_history=conversation_history,
        channel="voice",
    )

    response_text = result.get("message", result.get("answer", ""))

    # 3. TTS — Convert response to audio
    tts_config = voice_config.get("tts", {})
    try:
        tts_response = client.audio.speech.create(
            model=tts_config.get("model", "gpt-5.4-mini-tts"),
            voice=tts_config.get("voice", "alloy"),
            input=response_text,
            speed=tts_config.get("speed", 1.0),
            response_format=tts_config.get("response_format", "pcm16"),
            instructions=tts_config.get("instructions", ""),
        )
        audio_bytes = tts_response.content
    except Exception as e:
        audio_bytes = None

    return {
        "transcript": transcript,
        "response_text": response_text,
        "audio": audio_bytes,
        "intent": result.get("intent", {}),
        "type": result.get("type", "voice_response"),
        "needs_human_review": result.get("needs_human_review", False),
    }


async def handle_barge_in(session: dict) -> dict:
    """Handle barge-in (user interruption during TTS playback)."""
    return {
        "action": "stop_tts",
        "ready_for_input": True,
    }
