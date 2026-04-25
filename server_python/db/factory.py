# ==========================================
# AirOps AI — Rich Data Factory
# Generates coherent synthetic airline data
# for 30+ tables based on scenarios
# ==========================================

import random
import uuid
import json
from datetime import datetime, timedelta
from faker import Faker

from db.sqlite_manager import get_db, run_migrations, reset_db

fake = Faker("pt_BR")

# Increased volume as requested by user
TOTAL_FLIGHTS = 300
TOTAL_PNRS = 1500
TOTAL_CASES = 8000

AIRPORTS = [
    {"code": "GRU", "name": "Guarulhos", "city": "São Paulo", "terminal": "2"},
    {"code": "CGH", "name": "Congonhas", "city": "São Paulo", "terminal": "1"},
    {"code": "GIG", "name": "Galeão", "city": "Rio de Janeiro", "terminal": "2"},
    {"code": "BSB", "name": "Brasília", "city": "Brasília", "terminal": "1"},
    {"code": "CNF", "name": "Confins", "city": "Belo Horizonte", "terminal": "1"},
    {"code": "SSA", "name": "Salvador", "city": "Salvador", "terminal": "1"},
    {"code": "REC", "name": "Recife", "city": "Recife", "terminal": "1"},
    {"code": "FOR", "name": "Fortaleza", "city": "Fortaleza", "terminal": "2"},
    {"code": "MIA", "name": "Miami Intl.", "city": "Miami", "terminal": "N"},
    {"code": "LIS", "name": "Lisboa", "city": "Lisboa", "terminal": "1"},
]

AIRCRAFT = ["Airbus A320neo", "Boeing 737 MAX 8", "Airbus A330-200"]
GATES = ["A01", "A05", "B03", "C14", "D09"]
CABINS = ["economy", "premium-economy", "business"]
DELAY_REASONS = ["Manutenção não programada", "Condições meteorológicas", "Tráfego aéreo"]

FARE_RULES_DATA = [
    ("LIGHT", "light", 0, 0, 0, 0, 0, 0, 1, 0, 0, "Tarifa Light"),
    ("PLUS", "plus", 0, 1, 150, 250, 500, 1, 1, 1, 23, "Tarifa Plus"),
    ("MAX", "max", 1, 1, 0, 50, 200, 1, 1, 2, 23, "Tarifa MAX"),
    ("FLEX", "flex", 1, 1, 0, 0, 100, 1, 1, 2, 32, "Tarifa FLEX"),
]

SCENARIOS = [
    {"scenario": "flight_on_time", "percentage": 30},
    {"scenario": "flight_delayed_below_1h", "percentage": 15},
    {"scenario": "flight_delayed_above_2h", "percentage": 15},
    {"scenario": "flight_delayed_above_4h", "percentage": 8},
    {"scenario": "flight_cancelled", "percentage": 10},
    {"scenario": "missed_connection", "percentage": 8},
    {"scenario": "baggage_missing", "percentage": 8},
    {"scenario": "refund_pending", "percentage": 3},
    {"scenario": "overbooking", "percentage": 1},
    {"scenario": "fraud_risk", "percentage": 1},
    {"scenario": "human_handoff", "percentage": 1},
]

def pick(arr): return random.choice(arr)
def rand_int(lo, hi): return random.randint(lo, hi)

def weighted_status():
    roll = random.random() * 100
    if roll < 50: return ("on-time", 0)
    if roll < 75: return ("delayed", rand_int(15, 60))
    if roll < 85: return ("delayed", rand_int(61, 120))
    if roll < 93: return ("delayed", rand_int(121, 240))
    return ("cancelled", 0)

def run_data_factory():
    print("🏭 AirOps Data Factory — Gerando dados sintéticos ricos (Volume Aumentado)...")
    run_migrations()
    reset_db()
    db = get_db()
    cur = db.cursor()
    now = datetime.utcnow()

    # 1. Fare Rules & Policies
    for fr in FARE_RULES_DATA:
        cur.execute("INSERT INTO fare_rules (fare_basis,fare_family,refundable,change_allowed,change_fee,cancel_fee,no_show_penalty,voucher_allowed,free_rebooking_on_irop,baggage_included,baggage_weight_kg,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", fr)

    policies = [
        ("POL001", "refund_policy", "Política de Reembolso", "A devolução ocorre em até 7 dias úteis."),
        ("POL002", "baggage_policy", "Política de Bagagem", "1 mala de 23kg na tarifa Plus."),
    ]
    for p in policies:
        cur.execute("INSERT INTO company_policy_documents (policy_id, policy_type, title, content_summary) VALUES (?,?,?,?)", p)

    # 2. Flights
    flight_data = []
    for _ in range(TOTAL_FLIGHTS):
        fid = str(uuid.uuid4())
        origin = pick(AIRPORTS)
        dest = pick(AIRPORTS)
        while dest["code"] == origin["code"]: dest = pick(AIRPORTS)
        status, delay_min = weighted_status()
        flight_num = f"AO{rand_int(1000, 9999)}"
        dep = now + timedelta(hours=rand_int(-48, 72))
        arr = dep + timedelta(hours=rand_int(1, 4))
        actual_dep = (dep + timedelta(minutes=delay_min)).isoformat() if delay_min > 0 else (dep.isoformat() if status != "cancelled" else None)
        actual_arr = (arr + timedelta(minutes=delay_min)).isoformat() if status != "cancelled" else None
        delay_reason = pick(DELAY_REASONS) if (delay_min > 0 or status == "cancelled") else None

        flight_data.append({"id": fid, "status": status, "delay": delay_min, "number": flight_num, "origin": origin["code"], "dest": dest["code"], "dep": dep.isoformat(), "arr": arr.isoformat()})

        cur.execute("INSERT INTO flight_segments (id,flight_number,origin,destination,scheduled_departure,scheduled_arrival,actual_departure,actual_arrival,segment_status,delay_minutes,delay_reason,gate,terminal,aircraft,cabin) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (fid, flight_num, origin["code"], dest["code"], dep.isoformat(), arr.isoformat(), actual_dep, actual_arr, status, delay_min, delay_reason, pick(GATES), origin["terminal"], pick(AIRCRAFT), pick(CABINS)))

        if status in ("delayed", "cancelled"):
            evt_type = "cancellation" if status == "cancelled" else "delay"
            cur.execute("INSERT INTO flight_status_events (id,flight_id,event_type,delay_minutes,reason_code,reason_description,timestamp) VALUES (?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), fid, evt_type, delay_min, "WX", delay_reason, dep.isoformat()))
            if delay_min >= 120 or status == "cancelled":
                reg = "delay_above_2h" if delay_min < 240 else "delay_above_4h"
                if status == "cancelled": reg = "cancellation"
                cur.execute("INSERT INTO irregular_operations (id,flight_id,irop_type,started_at,reason_description,regulatory_trigger) VALUES (?,?,?,?,?,?)",
                    (str(uuid.uuid4()), fid, evt_type, dep.isoformat(), delay_reason, reg))

    # 3. PNRs, Passengers, Auth, Consent
    pnr_locators = []
    pnr_customer_map = {}
    
    # Pre-calculate scenario distribution
    scenario_counts = {s["scenario"]: int(TOTAL_CASES * (s["percentage"] / 100.0)) for s in SCENARIOS}
    scenario_pool = []
    for sc, count in scenario_counts.items():
        scenario_pool.extend([sc] * count)
    random.shuffle(scenario_pool)
    # Ensure pool size is at least TOTAL_CASES by padding with 'flight_on_time'
    while len(scenario_pool) < TOTAL_CASES:
        scenario_pool.append("flight_on_time")

    for i in range(TOTAL_PNRS):
        locator = fake.bothify("??????").upper()
        customer_id = f"CUST{str(i).zfill(5)}"
        pnr_locators.append(locator)
        pnr_customer_map[locator] = customer_id

        fare = pick(FARE_RULES_DATA)
        base_fare = rand_int(200, 2000)
        book_date = (now - timedelta(days=rand_int(1, 45))).isoformat()
        first, last = fake.first_name(), fake.last_name()
        email = f"{first.lower()}.{last.lower()}@{fake.free_email_domain()}"
        phone = f"+55 11 9{rand_int(1000,9999)}-{rand_int(1000,9999)}"
        cpf = f"{rand_int(100,999)}.000.000-{rand_int(10,99)}"

        cur.execute("INSERT INTO pnr_reservations (locator,customer_id,booking_date,total_amount,contact_email,contact_phone) VALUES (?,?,?,?,?,?)",
            (locator, customer_id, book_date, base_fare * 1.25, email, phone))
        
        pax_id = str(uuid.uuid4())
        cur.execute("INSERT INTO passengers (id,pnr,customer_id,first_name,last_name,document_number,document_last4,email,phone) VALUES (?,?,?,?,?,?,?,?,?)",
            (pax_id, locator, customer_id, first, last, cpf, cpf[-5:].replace("-", ""), email, phone))

        cur.execute("INSERT OR IGNORE INTO customer_identity_map (customer_id,document_hash,verified_phone_last4) VALUES (?,?,?)",
            (customer_id, f"hash_{cpf}", phone[-4:]))
            
        cur.execute("INSERT OR IGNORE INTO consent_privacy_flags (customer_id,can_contact_whatsapp) VALUES (?,1)", (customer_id,))

        seg = pick(flight_data)
        cur.execute("INSERT INTO pnr_segments (pnr,segment_id) VALUES (?,?)", (locator, seg["id"]))
        ticket_num = f"955{rand_int(1000000000,9999999999)}"
        cur.execute("INSERT INTO tickets (ticket_number,pnr,passenger_id,segment_id,fare_basis) VALUES (?,?,?,?,?)",
            (ticket_num, locator, pax_id, seg["id"], fare[0]))

        pay_id = str(uuid.uuid4())
        cur.execute("INSERT INTO payments (id,pnr,customer_id,payment_status,amount) VALUES (?,?,?,?,?)",
            (pay_id, locator, customer_id, "approved", base_fare * 1.25))

        if random.random() > 0.95:  # 5% have refunds
            cur.execute("INSERT INTO refunds (id,ticket_number,pnr,payment_id,refund_status,amount) VALUES (?,?,?,?,?,?)",
                (str(uuid.uuid4()), ticket_num, locator, pay_id, "pending", base_fare))

    # 4. Support Cases & AI Telemetry
    for i in range(TOTAL_CASES):
        pnr = pick(pnr_locators)
        customer_id = pnr_customer_map[pnr]
        scenario = scenario_pool[i]
        case_id = f"CAS-{fake.bothify('????????').upper()}"
        opened = now - timedelta(hours=rand_int(1, 48))
        
        # Human handoff condition
        status = "escalated" if scenario == "human_handoff" else "resolved"
        
        cur.execute("INSERT INTO support_cases (case_id,pnr,customer_id,scenario_id,case_status,opened_at,csat_score) VALUES (?,?,?,?,?,?,?)",
            (case_id, pnr, customer_id, scenario, status, opened.isoformat(), rand_int(3, 5)))

        sess_id = str(uuid.uuid4())
        res_type = "escalated" if status == "escalated" else "info_provided"
        if scenario == "flight_delayed_above_2h": res_type = "voucher_meal_offered"
        
        cur.execute("INSERT INTO agent_sessions (session_id,case_id,customer_id,pnr,started_at,session_status,authenticated,auth_level,resolution_type) VALUES (?,?,?,?,?,?,?,?,?)",
            (sess_id, case_id, customer_id, pnr, opened.isoformat(), "completed", 1, "pnr_lastname", res_type))
            
        cur.execute("INSERT INTO support_interactions (id,case_id,session_id,sender,message) VALUES (?,?,?,?,?)",
            (str(uuid.uuid4()), case_id, sess_id, "customer", f"Problema com {scenario}"))
            
        cur.execute("INSERT INTO agent_latency (id,session_id,llm_latency_ms,tool_latency_ms) VALUES (?,?,?,?)",
            (str(uuid.uuid4()), sess_id, 800, 300))
            
        cur.execute("INSERT INTO csat_predictions (id,session_id,predicted_csat,drivers) VALUES (?,?,?,?)",
            (str(uuid.uuid4()), sess_id, 4.5, "fast_resolution"))
            
        cur.execute("INSERT INTO agent_resolution_outcomes (id,session_id,case_id,intent,resolution_type,resolved_by,customer_accepted) VALUES (?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), sess_id, case_id, scenario, res_type, "human" if status=="escalated" else "ai", 1))

        if status == "escalated":
            cur.execute("INSERT INTO human_handoff_queue (handoff_id,session_id,case_id,reason) VALUES (?,?,?,?)",
                (str(uuid.uuid4()), sess_id, case_id, "customer_requested"))

        if res_type == "voucher_meal_offered":
            cur.execute("INSERT INTO material_assistance (id,pnr,customer_id,assistance_type,amount) VALUES (?,?,?,?,?)",
                (str(uuid.uuid4()), pnr, customer_id, "meal_voucher", 50))
            cur.execute("INSERT INTO regulatory_decision_logs (id,session_id,case_id,pnr,rule_applied) VALUES (?,?,?,?,?)",
                (str(uuid.uuid4()), sess_id, case_id, pnr, "delay_above_2h"))

        if scenario == "fraud_risk":
            cur.execute("INSERT INTO fraud_alerts (id,session_id,customer_id,pnr,risk_type,risk_score) VALUES (?,?,?,?,?,?)",
                (str(uuid.uuid4()), sess_id, customer_id, pnr, "refund_fraud", 0.9))

    db.commit()
    print("\n✅ Data Factory Completa (Fast Execution)!")

if __name__ == "__main__":
    run_data_factory()
