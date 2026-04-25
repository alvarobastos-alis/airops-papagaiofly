# ==========================================
# AirOps AI — OpenAI Client Singleton
# Handles connection to OpenAI API
# ==========================================

from openai import AsyncOpenAI
from config.settings import settings

_client: AsyncOpenAI | None = None

def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if settings.has_openai_key:
            _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            # Fallback mock client if needed, or raise
            # For now we initialize it with a dummy key so it doesn't crash on import
            _client = AsyncOpenAI(api_key="sk-mock")
    return _client

def is_openai_available() -> bool:
    return settings.has_openai_key
