# ==========================================
# AirOps AI — Environment Configuration
# Validates all required env vars at startup
# ==========================================

from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # App
    NODE_ENV: Literal["development", "production", "test"] = "development"
    PORT: int = 3001
    CORS_ORIGIN: str = "http://localhost:5173"
    LOG_LEVEL: Literal["debug", "info", "warn", "error"] = "info"

    # Auth (Clerk)
    CLERK_SECRET_KEY: str = "sk_test_placeholder"

    # OpenAI — API Key
    OPENAI_API_KEY: str = "sk-placeholder"

    # OpenAI — Chat / Reasoning
    OPENAI_CHAT_MODEL: str = "gpt-5.4"
    OPENAI_REASONING_MODEL: str = "gpt-5.4"

    # OpenAI — Embeddings (RAG)
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536

    # OpenAI — Voice / Realtime
    OPENAI_REALTIME_MODEL: str = "gpt-4o-realtime-preview-2024-12-17"
    OPENAI_REALTIME_VOICE: str = "alloy"

    # OpenAI — TTS / STT
    OPENAI_TTS_MODEL: str = "gpt-5.4-mini-tts"
    OPENAI_STT_MODEL: str = "gpt-4o-transcribe"

    # OpenAI — Image Generation
    OPENAI_IMAGE_MODEL: str = "dall-e-3"

    # Database (optional for MVP)
    DATABASE_URL: str | None = None
    REDIS_URL: str | None = None

    # Security flags
    PII_MASKING_ENABLED: bool = True
    SAFETY_INJECTION_ENABLED: bool = True
    OUTPUT_GUARDRAILS_ENABLED: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def has_openai_key(self) -> bool:
        """Check if a real OpenAI API key is configured."""
        return (
            self.OPENAI_API_KEY
            and self.OPENAI_API_KEY != "sk-placeholder"
            and len(self.OPENAI_API_KEY) > 10
        )


settings = Settings()
