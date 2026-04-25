# ==========================================
# AirOps AI — Auth Engine (Session Security)
# PII masking + secure PNR lookup
# ==========================================

import re
from db.sqlite_manager import get_db


def mask_sensitive_fields(data: dict) -> dict:
    """Mask PII fields in a dict recursively."""
    sensitive = ["cpf", "document_number", "email", "phone", "credit_card"]
    masked = dict(data)

    for key in list(masked.keys()):
        val = str(masked.get(key, "") or "")
        k = key.lower()

        if any(f in k for f in sensitive):
            if "cpf" in k or "document" in k:
                masked[key] = f"***{val[-4:]}" if len(val) > 4 else "***"
            elif "email" in k:
                masked[key] = re.sub(r"(.{2})(.*)(@.*)", r"\1***\3", val) if "@" in val else "***"
            elif "phone" in k:
                masked[key] = f"***{val[-4:]}" if len(val) > 4 else "***"
            elif "credit" in k:
                masked[key] = f"****-****-****-{val[-4:]}" if len(val) > 4 else "****"

        if isinstance(masked[key], dict):
            masked[key] = mask_sensitive_fields(masked[key])

    return masked


def secure_pnr_lookup(locator: str, last_name: str | None = None) -> dict:
    """Lookup PNR with security scope, joining all related tables."""
    db = get_db()

    pnr = db.execute("SELECT * FROM pnr_reservations WHERE locator = ?", (locator,)).fetchone()
    if not pnr:
        return {"found": False, "error": "PNR não encontrado."}

    passengers = [dict(r) for r in db.execute("SELECT * FROM passengers WHERE pnr = ?", (locator,)).fetchall()]

    # Guardrail: If last_name provided, validate
    if last_name:
        match = any(p["last_name"].lower() == last_name.lower() for p in passengers)
        if not match:
            return {"found": False, "error": "Sobrenome não corresponde à reserva."}

    raw_segments = [dict(r) for r in db.execute("""
        SELECT fs.* FROM flight_segments fs
        JOIN pnr_segments ps ON ps.segment_id = fs.id
        WHERE ps.pnr = ?
        ORDER BY ps.sequence_number
    """, (locator,)).fetchall()]
    
    segments = []
    for s in raw_segments:
        segments.append({
            "id": s.get("id"),
            "flightNumber": s.get("flight_number"),
            "airline": s.get("airline"),
            "origin": {"code": s.get("origin")},
            "destination": {"code": s.get("destination")},
            "scheduledDeparture": s.get("scheduled_departure"),
            "actualDeparture": s.get("actual_departure"),
            "scheduledArrival": s.get("scheduled_arrival"),
            "status": s.get("segment_status"),
            "delayMinutes": s.get("delay_minutes"),
            "gate": s.get("gate"),
            "aircraft": s.get("aircraft"),
            "seatNumber": s.get("seat")
        })

    raw_tickets = [dict(r) for r in db.execute("""
        SELECT t.*, fr.fare_family, fr.refundable, fr.change_allowed, fr.change_fee,
               fr.cancel_fee, fr.voucher_allowed, fr.free_rebooking_on_irop,
               fr.baggage_included, fr.baggage_weight_kg, fr.description as fare_description
        FROM tickets t
        LEFT JOIN fare_rules fr ON t.fare_basis = fr.fare_basis
        WHERE t.pnr = ?
    """, (locator,)).fetchall()]
    
    tickets = []
    for t in raw_tickets:
        tickets.append({
            "eTicket": t.get("ticket_number"),
            "fareBasis": t.get("fare_basis"),
            "amount": t.get("total_amount") or 0,
            "fareRules": {
                "refundable": bool(t.get("refundable")),
                "changeAllowed": bool(t.get("change_allowed")),
                "changeFee": t.get("change_fee") or 0,
                "cancelFee": t.get("cancel_fee") or 0,
                "creditEligible": bool(t.get("voucher_allowed"))
            }
        })

    baggage = [dict(r) for r in db.execute("SELECT * FROM baggage_items WHERE pnr = ?", (locator,)).fetchall()]

    loyalty = None
    if passengers and passengers[0].get("customer_id"):
        row = db.execute("SELECT * FROM loyalty_profiles WHERE customer_id = ?", (passengers[0]["customer_id"],)).fetchone()
        if row:
            loyalty = dict(row)
            
    mapped_passengers = []
    for p in passengers:
        mapped_passengers.append({
            "id": p.get("id"),
            "firstName": p.get("first_name"),
            "lastName": p.get("last_name"),
            "email": p.get("email"),
            "phone": p.get("phone"),
            "loyaltyTier": loyalty.get("tier") if loyalty else "standard",
            "loyaltyMiles": loyalty.get("miles_balance") if loyalty else 0,
        })
            
    # Guardrail 3: Never expose full details to agent context, ONLY masked
    masked_pnr = dict(pnr)
    masked_pnr = mask_sensitive_fields(masked_pnr)

    return {
        "found": True,
        "pnr": {
            "locator": locator,
            **masked_pnr,
            "passengers": [mask_sensitive_fields(p) for p in mapped_passengers],
            "segments": segments,
            "tickets": tickets,
            "baggage": baggage,
            "loyalty": loyalty,
        },
    }
