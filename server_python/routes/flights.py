# ==========================================
# AirOps AI — Flights API Route
# ==========================================

from fastapi import APIRouter, Query
from db.sqlite_manager import get_db

router = APIRouter(prefix="/api/flights", tags=["Flights"])


@router.get("/")
def list_flights(status: str | None = None, origin: str | None = None, destination: str | None = None, limit: int = Query(default=50)):
    db = get_db()
    query = "SELECT * FROM flight_segments WHERE 1=1"
    params = []
    if status:
        query += " AND segment_status = ?"
        params.append(status)
    if origin:
        query += " AND origin = ?"
        params.append(origin)
    if destination:
        query += " AND destination = ?"
        params.append(destination)
    query += " ORDER BY scheduled_departure DESC LIMIT ?"
    params.append(limit)
    return [dict(r) for r in db.execute(query, params).fetchall()]


@router.get("/disruptions")
def get_disruptions():
    db = get_db()
    rows = db.execute("""
        SELECT io.*, fs.flight_number, fs.origin, fs.destination, fs.scheduled_departure
        FROM irregular_operations io
        JOIN flight_segments fs ON io.flight_id = fs.id
        ORDER BY io.started_at DESC
        LIMIT 20
    """).fetchall()
    return [dict(r) for r in rows]


@router.get("/{flight_id}/events")
def get_flight_events(flight_id: str):
    db = get_db()
    return [dict(r) for r in db.execute("SELECT * FROM flight_status_events WHERE flight_id = ? ORDER BY timestamp DESC", (flight_id,)).fetchall()]
