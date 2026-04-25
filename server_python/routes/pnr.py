# ==========================================
# AirOps AI — PNR API Route
# ==========================================

from fastapi import APIRouter
from services.auth_engine import secure_pnr_lookup
from services.decision_engine import evaluate_flight_disruption, evaluate_refund_eligibility, evaluate_baggage_rights

router = APIRouter(prefix="/api/pnr", tags=["PNR"])


@router.get("/{locator}")
def get_pnr(locator: str):
    result = secure_pnr_lookup(locator.upper())
    if not result["found"]:
        return {"error": result["error"]}, 404
    return result["pnr"]


@router.get("/{locator}/rights")
def get_pnr_rights(locator: str):
    result = secure_pnr_lookup(locator.upper())
    if not result["found"]:
        return {"error": result["error"]}, 404

    pnr = result["pnr"]
    flight_rights = []

    for seg in pnr.get("segments", []):
        is_cancelled = seg.get("segment_status") == "cancelled"
        delay_min = seg.get("delay_minutes", 0) or 0
        disruption = evaluate_flight_disruption(delay_min, is_cancelled, False)
        flight_rights.append({"flightNumber": seg["flight_number"], "origin": seg["origin"], "destination": seg["destination"], **disruption})

    baggage_rights = []
    for b in pnr.get("baggage", []):
        if b.get("baggage_status") in ("missing", "delayed"):
            baggage_rights.append(evaluate_baggage_rights(True, b.get("days_missing", 0)))

    refund_eligibility = None
    tickets = pnr.get("tickets", [])
    if tickets:
        t = tickets[0]
        has_irop = any(s.get("segment_status") == "cancelled" or (s.get("delay_minutes") or 0) >= 240 for s in pnr.get("segments", []))
        refund_eligibility = evaluate_refund_eligibility(
            {"refundable": bool(t.get("refundable")), "change_fee": t.get("change_fee", 0), "cancel_fee": t.get("cancel_fee", 0), "voucher_allowed": bool(t.get("voucher_allowed")), "fare_family": t.get("fare_family", "basic")},
            "involuntary" if has_irop else "voluntary",
            t.get("total_amount", 0),
        )

    return {"locator": locator.upper(), "flightRights": flight_rights, "baggageRights": baggage_rights, "refundEligibility": refund_eligibility}
