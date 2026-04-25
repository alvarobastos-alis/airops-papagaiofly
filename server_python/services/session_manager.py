# ==========================================
# AirOps AI — Session Manager
# Manages authenticated sessions and context
# ==========================================

import uuid
from datetime import datetime
from db.sqlite_manager import get_db

def create_session(customer_id: str, pnr: str, channel: str = "chat", auth_level: str = "pnr_lastname") -> str:
    """Create a new authenticated session."""
    session_id = f"SES-{uuid.uuid4().hex[:8].upper()}"
    db = get_db()
    
    # Try to find existing case or create one
    case = db.execute("SELECT case_id FROM support_cases WHERE pnr = ? AND case_status = 'open'", (pnr,)).fetchone()
    if case:
        case_id = case["case_id"]
    else:
        case_id = f"CAS-{uuid.uuid4().hex[:8].upper()}"
        db.execute("INSERT INTO support_cases (case_id, pnr, customer_id, scenario_id, case_status, opened_channel) VALUES (?, ?, ?, ?, ?, ?)",
            (case_id, pnr, customer_id, "general-inquiry", "open", channel))
    
    db.execute("""
        INSERT INTO agent_sessions (session_id, case_id, customer_id, pnr, channel, session_status, authenticated, auth_level) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (session_id, case_id, customer_id, pnr, channel, "active", 1, auth_level))
    
    db.commit()
    return session_id

def validate_session_scope(session_id: str, target_pnr: str) -> bool:
    """Guardrail 1: Ensure session is authorized to access target_pnr."""
    db = get_db()
    session = db.execute("SELECT pnr FROM agent_sessions WHERE session_id = ?", (session_id,)).fetchone()
    if not session:
        return False
    return session["pnr"].upper() == target_pnr.upper()

def get_session_context(session_id: str) -> dict | None:
    """Retrieve full context for an active session."""
    db = get_db()
    session = db.execute("SELECT * FROM agent_sessions WHERE session_id = ?", (session_id,)).fetchone()
    if not session:
        return None
    return dict(session)

def log_tool_call(session_id: str, tool_name: str, input_summary: str, output_summary: str, success: bool, latency_ms: int):
    """Log an agent tool execution."""
    db = get_db()
    db.execute("""
        INSERT INTO agent_tool_calls (id, session_id, tool_name, input_summary, output_summary, success, latency_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), session_id, tool_name, input_summary, output_summary, 1 if success else 0, latency_ms))
    db.commit()
