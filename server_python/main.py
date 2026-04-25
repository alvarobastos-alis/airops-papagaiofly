# ==========================================
# AirOps AI — FastAPI Server Entry Point
# ==========================================

import os
import sys

# Ensure server_python is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Fix Windows console encoding for UTF-8 (emojis in logs)
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from config.settings import settings
from db.sqlite_manager import get_db, run_migrations
from db.factory import run_data_factory
from db.seed_scenarios import seed_demo_scenarios
from services.rag import compile_rag
from config.config_loader import validate_all as validate_yaml_configs
from routes.chat import router as chat_router
from routes.pnr import router as pnr_router
from routes.flights import router as flights_router
from routes.analytics import router as analytics_router
from routes.voice import router as voice_router
from routes.voice_ws import router as voice_ws_router
from routes.rag import router as rag_router
from routes.decision_tree import router as decision_tree_router
from routes.sac import router as sac_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: seed data + compile RAG."""
    print(f"""
  ✈️  AirOps AI Server v4.0.0 (Python)
  ──────────────────────────
  🌐 http://localhost:{settings.PORT}
  📡 Environment: {settings.NODE_ENV}
  🤖 Model: {settings.OPENAI_CHAT_MODEL}
  🔒 Security Layers:
     • PII Masking: {"✅" if settings.PII_MASKING_ENABLED else "❌"}
     • Safety Injection: {"✅" if settings.SAFETY_INJECTION_ENABLED else "❌"}
     • Output Guardrails: {"✅" if settings.OUTPUT_GUARDRAILS_ENABLED else "❌"}
  ──────────────────────────
    """)

    # Seed data if needed
    db = get_db()
    try:
        count = db.execute("SELECT COUNT(*) FROM support_cases").fetchone()[0]
        if count == 0:
            run_data_factory()
            seed_demo_scenarios()
        else:
            # Always ensure demo PNRs exist (they may have been wiped by reset_db)
            demo_check = db.execute("SELECT COUNT(*) FROM pnr_reservations WHERE locator = 'XKRM47'").fetchone()[0]
            if demo_check == 0:
                print("⚠️  Demo PNRs ausentes — re-seeding...")
                seed_demo_scenarios()
    except Exception:
        run_data_factory()
        seed_demo_scenarios()

    await compile_rag()

    # Validate YAML configs
    config_status = validate_yaml_configs()
    configs_ok = all(config_status.values())
    print(f"  📋 YAML Configs: {'✅ All valid' if configs_ok else '⚠️ Some failed'}")
    for name, ok in config_status.items():
        if not ok:
            print(f"     ❌ {name}.yaml failed validation")
    print()

    yield


app = FastAPI(
    title="AirOps AI",
    description="Airline Customer Operations AI Platform",
    version="4.0.0",
    lifespan=lifespan,
)

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Health check ----
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "4.0.0",
        "environment": settings.NODE_ENV,
        "timestamp": datetime.utcnow().isoformat(),
        "runtime": "python",
        "security": {
            "piiMasking": settings.PII_MASKING_ENABLED,
            "safetyInjection": settings.SAFETY_INJECTION_ENABLED,
            "outputGuardrails": settings.OUTPUT_GUARDRAILS_ENABLED,
        },
    }


# ---- Routes ----
app.include_router(chat_router)
app.include_router(pnr_router)
app.include_router(flights_router)
app.include_router(analytics_router)
app.include_router(voice_router)
app.include_router(voice_ws_router)
app.include_router(rag_router)
app.include_router(decision_tree_router)
app.include_router(sac_router)
