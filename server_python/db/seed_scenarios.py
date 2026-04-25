# ==========================================
# AirOps AI — Demo Scenario Seeder
# Creates 10 known PNRs for testing/demo
# ==========================================

import uuid
from datetime import datetime, timedelta
from db.sqlite_manager import get_db, run_migrations

DEMO_PNRS = [
    {"locator": "XKRM47", "customer": "CUST_XKRM47", "firstName": "Carlos", "lastName": "Mendes", "email": "carlos.mendes@email.com", "phone": "+55 11 99876-5432", "cpf": "123.456.789-00", "tier": "gold", "miles": 85400, "flight": {"number": "AO1234", "origin": "GRU", "dest": "GIG", "status": "on-time", "delay": 0}, "fare": "PLUS", "amount": 890, "scenario": "Happy path — voo no horário"},
    {"locator": "TBVN83", "customer": "CUST_TBVN83", "firstName": "Maria", "lastName": "Silva", "email": "maria.silva@email.com", "phone": "+55 21 98765-4321", "cpf": "987.654.321-00", "tier": "standard", "miles": 5200, "flight": {"number": "AO1567", "origin": "GRU", "dest": "SSA", "status": "delayed", "delay": 135}, "fare": "PLUS", "amount": 1250, "scenario": "Atraso >2h (ANAC: alimentação)"},
    {"locator": "JPWQ56", "customer": "CUST_JPWQ56", "firstName": "Ana", "lastName": "Oliveira", "email": "ana.oliveira@email.com", "phone": "+55 41 99887-6655", "cpf": "456.789.123-00", "tier": "platinum", "miles": 155000, "flight": {"number": "AO3456", "origin": "GRU", "dest": "BSB", "status": "cancelled", "delay": 0}, "fare": "MAX", "amount": 2450, "scenario": "Voo cancelado (ANAC: full rights)"},
    {"locator": "MHFC92", "customer": "CUST_MHFC92", "firstName": "Roberto", "lastName": "Ferreira", "email": "roberto.f@email.com", "phone": "+55 31 98765-1234", "cpf": "789.123.456-00", "tier": "silver", "miles": 42000, "flight": {"number": "AO9012", "origin": "GRU", "dest": "EZE", "status": "delayed", "delay": 280}, "fare": "FLEX", "amount": 4200, "scenario": "Atraso >4h (ANAC: hospedagem + reacomodação)"},
    {"locator": "RNGS15", "customer": "CUST_RNGS15", "firstName": "Juliana", "lastName": "Costa", "email": "juliana.costa@email.com", "phone": "+55 11 91234-5678", "cpf": "321.654.987-00", "tier": "standard", "miles": 3100, "flight": {"number": "AO5678", "origin": "SSA", "dest": "REC", "status": "on-time", "delay": 0}, "fare": "PLUS", "amount": 520, "scenario": "Bagagem extraviada (dia 3 de 7)", "baggage": {"status": "missing", "daysMissing": 3, "lastAirport": "GRU"}},
    {"locator": "WDLA68", "customer": "CUST_WDLA68", "firstName": "Pedro", "lastName": "Santos", "email": "pedro.santos@email.com", "phone": "+55 61 99876-4321", "cpf": "654.987.321-00", "tier": "standard", "miles": 800, "flight": {"number": "AO2890", "origin": "CGH", "dest": "SDU", "status": "on-time", "delay": 0}, "fare": "LIGHT", "amount": 189, "scenario": "Tarifa LIGHT — pedido de reembolso (negar)"},
    {"locator": "FZEY74", "customer": "CUST_FZEY74", "firstName": "Fernanda", "lastName": "Lima", "email": "fernanda.lima@email.com", "phone": "+55 85 99123-4567", "cpf": "147.258.369-00", "tier": "gold", "miles": 78000, "flight": {"number": "AO4521", "origin": "GRU", "dest": "MIA", "status": "on-time", "delay": 0}, "fare": "FLEX", "amount": 12800, "scenario": "Overbooking (preterição)", "overbooking": True},
    {"locator": "GKTB29", "customer": "CUST_GKTB29", "firstName": "Lucas", "lastName": "Almeida", "email": "lucas.almeida@email.com", "phone": "+55 51 98765-8765", "cpf": "258.369.147-00", "tier": "silver", "miles": 31000, "flight": {"number": "AO6789", "origin": "BSB", "dest": "MAO", "status": "delayed", "delay": 90}, "fare": "PLUS", "amount": 1580, "scenario": "Conexão perdida por atraso do trecho anterior"},
    {"locator": "NLXP41", "customer": "CUST_NLXP41", "firstName": "Beatriz", "lastName": "Rodrigues", "email": "beatriz.r@email.com", "phone": "+55 21 91234-9876", "cpf": "369.147.258-00", "tier": "diamond", "miles": 312000, "flight": {"number": "AO7890", "origin": "GIG", "dest": "LIS", "status": "on-time", "delay": 0}, "fare": "FLEX", "amount": 18500, "scenario": "Cliente Diamond — atendimento prioritário"},
    {"locator": "SVQH03", "customer": "CUST_SVQH03", "firstName": "Thiago", "lastName": "Barbosa", "email": "thiago.b@email.com", "phone": "+55 11 98888-1234", "cpf": "111.222.333-44", "tier": "standard", "miles": 500, "flight": {"number": "AO8901", "origin": "CWB", "dest": "GRU", "status": "on-time", "delay": 0}, "fare": "MAX", "amount": 750, "scenario": "Possível fraude (risk_score alto)", "fraud": True},
]


def seed_demo_scenarios():
    print("Seeding cenários demo pré-configurados...\n")
    run_migrations()
    db = get_db()
    now = datetime.utcnow()

    for demo in DEMO_PNRS:
        pax_id = f"PAX_{demo['locator']}"
        flight_id = f"FLT_{demo['locator']}"
        dep = now + timedelta(hours=6)
        arr = dep + timedelta(hours=3)
        fl = demo["flight"]
        delay_reason = "Manutenção não programada" if fl["delay"] > 0 else ("Condições meteorológicas adversas" if fl["status"] == "cancelled" else None)

        db.execute("INSERT OR REPLACE INTO pnr_reservations (locator,customer_id,booking_date,reservation_status,channel,trip_type,total_amount,currency,contact_email,contact_phone) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (demo["locator"], demo["customer"], now.isoformat(), "confirmed", "website", "one_way", demo["amount"], "BRL", demo["email"], demo["phone"]))

        email_masked = demo["email"][:2] + "***" + demo["email"][demo["email"].index("@"):]
        db.execute("INSERT OR REPLACE INTO passengers (id,pnr,customer_id,first_name,last_name,document_type,document_number,document_last4,email,phone,email_masked,phone_last4) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (pax_id, demo["locator"], demo["customer"], demo["firstName"], demo["lastName"], "cpf", demo["cpf"], demo["cpf"][-5:].replace("-", ""), demo["email"], demo["phone"], email_masked, demo["phone"][-4:]))

        db.execute("INSERT OR REPLACE INTO flight_segments (id,flight_number,airline,origin,destination,scheduled_departure,scheduled_arrival,segment_status,delay_minutes,delay_reason,gate,terminal,aircraft,cabin) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (flight_id, fl["number"], "AirOps", fl["origin"], fl["dest"], dep.isoformat(), arr.isoformat(), fl["status"], fl["delay"], delay_reason, "A12", "2", "Airbus A320neo", "economy"))

        db.execute("INSERT OR REPLACE INTO pnr_segments (pnr,segment_id,sequence_number) VALUES (?,?,?)", (demo["locator"], flight_id, 1))
        db.execute("INSERT OR REPLACE INTO tickets (ticket_number,pnr,passenger_id,segment_id,fare_basis,ticket_status,base_fare,taxes,total_amount) VALUES (?,?,?,?,?,?,?,?,?)",
            (f"955{demo['locator']}001", demo["locator"], pax_id, flight_id, demo["fare"], "issued", demo["amount"] * 0.8, demo["amount"] * 0.2, demo["amount"]))

        ltv = {"standard": 20, "silver": 50, "gold": 75}.get(demo["tier"], 95)
        db.execute("INSERT OR REPLACE INTO loyalty_profiles (customer_id,loyalty_id,tier,miles_balance,lifetime_value_score,priority_service) VALUES (?,?,?,?,?,?)",
            (demo["customer"], f"AO-{demo['tier'].upper()[:4]}-{demo['locator']}", demo["tier"], demo["miles"], ltv, 1 if demo["tier"] in ("platinum", "diamond") else 0))

        # New tables
        db.execute("INSERT OR REPLACE INTO customer_identity_map (customer_id,document_hash,verified_phone_last4) VALUES (?,?,?)", (demo["customer"], f"hash_{demo['cpf']}", demo["phone"][-4:]))
        db.execute("INSERT OR REPLACE INTO consent_privacy_flags (customer_id,can_contact_whatsapp) VALUES (?,1)", (demo["customer"],))

        if demo.get("baggage"):
            bg = demo["baggage"]
            db.execute("INSERT OR REPLACE INTO baggage_items (tag_number,pnr,baggage_status,last_known_airport,pir_number,description,days_missing,weight_kg) VALUES (?,?,?,?,?,?,?,?)",
                (f"AO-BAG-{demo['locator']}", demo["locator"], bg["status"], bg["lastAirport"], f"PIR-2026-{demo['locator']}", "Mala preta rígida Samsonite", bg["daysMissing"], 23))

        if demo.get("fraud"):
            db.execute("INSERT OR REPLACE INTO fraud_alerts (id,customer_id,pnr,risk_type,risk_score,action_taken) VALUES (?,?,?,?,?,?)",
                (str(uuid.uuid4()), demo["customer"], demo["locator"], "refund_request_after_failed_auth", 0.82, "require_human_review"))

        if fl["status"] == "cancelled" or fl["delay"] >= 120:
            severity = "high" if (fl["status"] == "cancelled" or fl["delay"] >= 240) else "medium"
            assist, reg = "none", "none"
            if fl["delay"] >= 60: assist, reg = "communication", "delay_above_1h"
            if fl["delay"] >= 120: assist, reg = "food", "delay_above_2h"
            if fl["delay"] >= 240 or fl["status"] == "cancelled":
                assist = "full"
                reg = "cancellation" if fl["status"] == "cancelled" else "delay_above_4h"
            irop_type = "cancellation" if fl["status"] == "cancelled" else "delay"
            db.execute("INSERT OR REPLACE INTO irregular_operations (id,flight_id,irop_type,severity,started_at,reason_description,affected_passengers,regulatory_trigger,assistance_level) VALUES (?,?,?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), flight_id, irop_type, severity, dep.isoformat(), delay_reason, 156, reg, assist))

        print(f"   [OK] {demo['locator']} — {demo['scenario']}")

    # Ensure fare rules exist
    count = db.execute("SELECT COUNT(*) FROM fare_rules").fetchone()[0]
    if count == 0:
        for fr in [("LIGHT","light",0,0,0,0,0,0,1,0,0,"Tarifa Light"), ("PLUS","plus",0,1,150,250,500,1,1,1,23,"Tarifa Plus"), ("MAX","max",1,1,0,50,200,1,1,2,23,"Tarifa MAX"), ("FLEX","flex",1,1,0,0,100,1,1,2,32,"Tarifa FLEX Business")]:
            db.execute("INSERT OR IGNORE INTO fare_rules (fare_basis,fare_family,refundable,change_allowed,change_fee,cancel_fee,no_show_penalty,voucher_allowed,free_rebooking_on_irop,baggage_included,baggage_weight_kg,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", fr)

    db.commit()
    print("\nDemo scenarios prontos! PNRs disponíveis:")
    for d in DEMO_PNRS:
        print(f"   {d['locator']} — {d['firstName']} {d['lastName']} ({d['scenario'][:40]})")
    print()
