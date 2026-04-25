// ==========================================
// AirOps AI — Rich Data Factory
// Generates coherent synthetic airline data
// ==========================================
import { fakerPT_BR as faker } from '@faker-js/faker';
import { db, runMigrations, resetDB } from './sqlite.js';
import { v4 as uuid } from 'uuid';

// ---- Constants ----
const TOTAL_FLIGHTS = 200;
const TOTAL_PNRS = 1000;
const TOTAL_CASES = 5000;

const AIRPORTS = [
  { code: 'GRU', name: 'Guarulhos', city: 'São Paulo', terminal: '2' },
  { code: 'CGH', name: 'Congonhas', city: 'São Paulo', terminal: '1' },
  { code: 'GIG', name: 'Galeão', city: 'Rio de Janeiro', terminal: '2' },
  { code: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro', terminal: '1' },
  { code: 'BSB', name: 'Brasília', city: 'Brasília', terminal: '1' },
  { code: 'CNF', name: 'Confins', city: 'Belo Horizonte', terminal: '1' },
  { code: 'SSA', name: 'Dep. Luís Eduardo Magalhães', city: 'Salvador', terminal: '1' },
  { code: 'REC', name: 'Guararapes', city: 'Recife', terminal: '1' },
  { code: 'FOR', name: 'Pinto Martins', city: 'Fortaleza', terminal: '2' },
  { code: 'CWB', name: 'Afonso Pena', city: 'Curitiba', terminal: '1' },
  { code: 'POA', name: 'Salgado Filho', city: 'Porto Alegre', terminal: '1' },
  { code: 'FLN', name: 'Hercílio Luz', city: 'Florianópolis', terminal: '1' },
  { code: 'VCP', name: 'Viracopos', city: 'Campinas', terminal: '1' },
  { code: 'MAO', name: 'Eduardo Gomes', city: 'Manaus', terminal: '1' },
  { code: 'MIA', name: 'Miami Intl.', city: 'Miami', terminal: 'N' },
  { code: 'LIS', name: 'Humberto Delgado', city: 'Lisboa', terminal: '1' },
  { code: 'EZE', name: 'Ezeiza', city: 'Buenos Aires', terminal: 'A' },
];

const AIRCRAFT = ['Airbus A320neo', 'Airbus A321neo', 'Boeing 737-800', 'Boeing 737 MAX 8', 'Embraer E195-E2', 'Airbus A330-200', 'Boeing 787-9'];
const GATES = ['A01', 'A05', 'A12', 'B03', 'B07', 'B12', 'C03', 'C14', 'D09', 'D15', 'D22', 'E08'];
const CABINS = ['economy', 'premium-economy', 'business'];
const DELAY_REASONS = ['Manutenção não programada', 'Condições meteorológicas adversas', 'Restrição ATC', 'Atraso na chegada da aeronave', 'Atendimento médico a bordo', 'Tráfego aéreo congestionado'];
const SCENARIOS = ['status', 'delay', 'cancellation', 'baggage', 'refund', 'change', 'booking', 'overbooking', 'missed_connection', 'loyalty'];
const CHANNELS = ['voice', 'chat', 'whatsapp'];

const FARE_RULES_DATA = [
  { fare_basis: 'LIGHT', fare_family: 'light', refundable: 0, change_allowed: 0, change_fee: 0, cancel_fee: 0, no_show_penalty: 0, voucher_allowed: 0, free_rebooking_on_irop: 1, baggage_included: 0, baggage_weight_kg: 0, description: 'Tarifa Light — sem bagagem, sem alteração, sem reembolso' },
  { fare_basis: 'PLUS', fare_family: 'plus', refundable: 0, change_allowed: 1, change_fee: 150, cancel_fee: 250, no_show_penalty: 500, voucher_allowed: 1, free_rebooking_on_irop: 1, baggage_included: 1, baggage_weight_kg: 23, description: 'Tarifa Plus — 1 mala 23kg, alteração com taxa' },
  { fare_basis: 'MAX', fare_family: 'max', refundable: 1, change_allowed: 1, change_fee: 0, cancel_fee: 50, no_show_penalty: 200, voucher_allowed: 1, free_rebooking_on_irop: 1, baggage_included: 2, baggage_weight_kg: 23, description: 'Tarifa MAX — 2 malas 23kg, reembolsável, alteração grátis' },
  { fare_basis: 'FLEX', fare_family: 'flex', refundable: 1, change_allowed: 1, change_fee: 0, cancel_fee: 0, no_show_penalty: 100, voucher_allowed: 1, free_rebooking_on_irop: 1, baggage_included: 2, baggage_weight_kg: 32, description: 'Tarifa FLEX (Business) — reembolso integral, 2 malas 32kg' },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedStatus(): { status: string; delayMin: number } {
  const roll = Math.random() * 100;
  if (roll < 50) return { status: 'on-time', delayMin: 0 };
  if (roll < 60) return { status: 'landed', delayMin: 0 };
  if (roll < 65) return { status: 'boarding', delayMin: 0 };
  if (roll < 75) return { status: 'delayed', delayMin: randomInt(15, 60) };
  if (roll < 82) return { status: 'delayed', delayMin: randomInt(61, 120) };
  if (roll < 88) return { status: 'delayed', delayMin: randomInt(121, 240) };
  if (roll < 93) return { status: 'delayed', delayMin: randomInt(241, 480) };
  return { status: 'cancelled', delayMin: 0 };
}

export function runDataFactory() {
  console.log('🏭 AirOps Data Factory — Gerando dados sintéticos ricos...');
  console.log(`   Alvo: ${TOTAL_FLIGHTS} voos, ${TOTAL_PNRS} PNRs, ${TOTAL_CASES} casos`);

  runMigrations();
  resetDB();

  db.exec('BEGIN TRANSACTION');

  // ---- 1. Fare Rules ----
  const stmtFare = db.prepare('INSERT INTO fare_rules (fare_basis, fare_family, refundable, change_allowed, change_fee, cancel_fee, no_show_penalty, voucher_allowed, free_rebooking_on_irop, baggage_included, baggage_weight_kg, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  for (const r of FARE_RULES_DATA) {
    stmtFare.run(r.fare_basis, r.fare_family, r.refundable, r.change_allowed, r.change_fee, r.cancel_fee, r.no_show_penalty, r.voucher_allowed, r.free_rebooking_on_irop, r.baggage_included, r.baggage_weight_kg, r.description);
  }

  // ---- 2. Flights ----
  const stmtFlight = db.prepare('INSERT INTO flight_segments (id, flight_number, airline, origin, destination, scheduled_departure, scheduled_arrival, actual_departure, actual_arrival, segment_status, delay_minutes, delay_reason, gate, terminal, aircraft, cabin, seat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const stmtFSE = db.prepare('INSERT INTO flight_status_events (id, flight_id, event_type, delay_minutes, reason_code, reason_description, affected_passengers, timestamp) VALUES (?,?,?,?,?,?,?,?)');
  const stmtIROP = db.prepare('INSERT INTO irregular_operations (id, flight_id, irop_type, severity, started_at, expected_resolution_at, reason_code, reason_description, affected_passengers, regulatory_trigger, assistance_level) VALUES (?,?,?,?,?,?,?,?,?,?,?)');

  const flightIds: string[] = [];
  const flightData: { id: string; status: string; delayMin: number; number: string }[] = [];

  for (let i = 0; i < TOTAL_FLIGHTS; i++) {
    const id = uuid();
    flightIds.push(id);
    const origin = pick(AIRPORTS);
    let dest = pick(AIRPORTS);
    while (dest.code === origin.code) dest = pick(AIRPORTS);

    const { status, delayMin } = weightedStatus();
    const flightNum = `AO${randomInt(1000, 9999)}`;
    const dep = faker.date.soon({ days: 3 });
    const durationHours = (['MIA', 'LIS', 'EZE'].includes(dest.code) || ['MIA', 'LIS', 'EZE'].includes(origin.code)) ? randomInt(8, 12) : randomInt(1, 4);
    const arr = new Date(dep.getTime() + durationHours * 3600000);
    const actualDep = delayMin > 0 ? new Date(dep.getTime() + delayMin * 60000).toISOString() : (status === 'landed' || status === 'boarding' ? dep.toISOString() : null);
    const actualArr = status === 'landed' ? new Date(arr.getTime() + delayMin * 60000).toISOString() : null;
    const delayReason = delayMin > 0 ? pick(DELAY_REASONS) : (status === 'cancelled' ? pick(DELAY_REASONS) : null);

    flightData.push({ id, status, delayMin, number: flightNum });

    stmtFlight.run(id, flightNum, 'AirOps', origin.code, dest.code, dep.toISOString(), arr.toISOString(), actualDep, actualArr, status, delayMin, delayReason, pick(GATES), origin.terminal, pick(AIRCRAFT), pick(CABINS), null);

    // Flight Status Events
    if (status === 'delayed' || status === 'cancelled') {
      const evtType = status === 'cancelled' ? 'cancellation' : 'delay';
      const reasonCode = status === 'cancelled' ? 'CXL' : (delayReason?.includes('meteorol') ? 'WX' : delayReason?.includes('ATC') ? 'ATC' : 'TECH');
      const affectedPax = randomInt(60, 190);
      stmtFSE.run(uuid(), id, evtType, delayMin, reasonCode, delayReason, affectedPax, dep.toISOString());

      // IROP for significant disruptions
      if (delayMin >= 120 || status === 'cancelled') {
        const severity = status === 'cancelled' ? 'high' : delayMin >= 240 ? 'high' : 'medium';
        let assistLevel = 'none';
        let regTrigger = 'none';
        if (delayMin >= 60) { assistLevel = 'communication'; regTrigger = 'delay_above_1h'; }
        if (delayMin >= 120) { assistLevel = 'food'; regTrigger = 'delay_above_2h'; }
        if (delayMin >= 240 || status === 'cancelled') { assistLevel = 'full'; regTrigger = status === 'cancelled' ? 'cancellation' : 'delay_above_4h'; }

        const resolveAt = new Date(dep.getTime() + (delayMin + 120) * 60000);
        stmtIROP.run(uuid(), id, evtType, severity, dep.toISOString(), resolveAt.toISOString(), reasonCode, delayReason, affectedPax, regTrigger, assistLevel);
      }
    }
  }

  // ---- 3. PNRs + Passengers + Tickets ----
  const stmtPNR = db.prepare('INSERT INTO pnr_reservations (locator, customer_id, booking_date, reservation_status, channel, trip_type, total_amount, currency, contact_email, contact_phone, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const stmtPax = db.prepare('INSERT INTO passengers (id, pnr, customer_id, first_name, last_name, document_type, document_number, document_last4, date_of_birth, passenger_type, email_masked, phone_last4, email, phone) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const stmtTicket = db.prepare('INSERT INTO tickets (ticket_number, pnr, passenger_id, segment_id, fare_basis, ticket_status, issue_date, base_fare, taxes, total_amount) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const stmtPnrSeg = db.prepare('INSERT INTO pnr_segments (pnr, segment_id, sequence_number) VALUES (?,?,?)');
  const stmtCIM = db.prepare('INSERT OR IGNORE INTO customer_identity_map (customer_id, document_hash, email_hash, phone_hash, verified_phone_last4, identity_risk_score, last_verified_at) VALUES (?,?,?,?,?,?,?)');
  const stmtLoyalty = db.prepare('INSERT OR IGNORE INTO loyalty_profiles (customer_id, loyalty_id, tier, miles_balance, lifetime_value_score, priority_service) VALUES (?,?,?,?,?,?)');
  const stmtPayment = db.prepare('INSERT INTO payments (id, pnr, customer_id, payment_method, payment_status, amount, installments, authorization_code, paid_at) VALUES (?,?,?,?,?,?,?,?,?)');

  const pnrLocators: string[] = [];
  const pnrCustomerMap: Record<string, string> = {};

  for (let i = 0; i < TOTAL_PNRS; i++) {
    const locator = faker.string.alphanumeric(6).toUpperCase();
    const customerId = `CUST${String(i).padStart(5, '0')}`;
    pnrLocators.push(locator);
    pnrCustomerMap[locator] = customerId;

    const segCount = Math.random() > 0.7 ? 2 : 1;
    const segments = faker.helpers.arrayElements(flightData, segCount);
    const fare = pick(FARE_RULES_DATA);
    const baseFare = randomInt(200, 5000);
    const taxes = Math.round(baseFare * 0.25);
    const total = baseFare + taxes;

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const phone = `+55 ${randomInt(11, 99)} 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
    const cpf = `${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(10, 99)}`;
    const cpfLast4 = cpf.slice(-5).replace('-', '');
    const phoneLast4 = phone.slice(-4);
    const dob = faker.date.birthdate({ min: 18, max: 75, mode: 'age' });
    const tier = pick(['standard', 'standard', 'standard', 'silver', 'silver', 'gold', 'platinum', 'diamond']);
    const paxId = uuid();

    const channel = pick(['website', 'app', 'call_center']);
    const tripType = segCount > 1 ? 'round_trip' : 'one_way';
    const bookDate = faker.date.recent({ days: 45 });

    stmtPNR.run(locator, customerId, bookDate.toISOString(), 'confirmed', channel, tripType, total, 'BRL', email, phone, bookDate.toISOString());
    stmtPax.run(paxId, locator, customerId, firstName, lastName, 'cpf', cpf, cpfLast4, dob.toISOString(), 'adult', email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), phoneLast4, email, phone);

    for (let s = 0; s < segCount; s++) {
      stmtPnrSeg.run(locator, segments[s].id, s + 1);
      stmtTicket.run(`955${randomInt(1000000000, 9999999999)}`, locator, paxId, segments[s].id, fare.fare_basis, 'issued', bookDate.toISOString(), baseFare, taxes, total);
    }

    // Customer Identity Map
    stmtCIM.run(customerId, `hash_${cpf}`, `hash_${email}`, `hash_${phone}`, phoneLast4, Math.random() * 0.3, bookDate.toISOString());

    // Loyalty
    const miles = tier === 'standard' ? randomInt(0, 10000) : tier === 'silver' ? randomInt(10000, 50000) : tier === 'gold' ? randomInt(50000, 150000) : randomInt(150000, 500000);
    const ltv = tier === 'standard' ? randomInt(10, 40) : tier === 'silver' ? randomInt(40, 60) : tier === 'gold' ? randomInt(60, 85) : randomInt(85, 100);
    stmtLoyalty.run(customerId, `AO-${tier.toUpperCase().slice(0, 4)}-${randomInt(1000000, 9999999)}`, tier, miles, ltv, tier === 'platinum' || tier === 'diamond' ? 1 : 0);

    // Payment
    stmtPayment.run(uuid(), locator, customerId, pick(['credit_card', 'credit_card', 'pix', 'debit']), 'approved', total, pick([1, 2, 3, 6, 10, 12]), `AUTH${randomInt(100000, 999999)}`, bookDate.toISOString());
  }

  // ---- 4. Baggage ----
  const stmtBag = db.prepare('INSERT INTO baggage_items (tag_number, pnr, passenger_id, segment_id, weight_kg, baggage_status, last_known_airport, pir_number, description, days_missing) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const stmtBagEvt = db.prepare('INSERT INTO baggage_events (id, tag_number, event_time, airport, event_type, event_description) VALUES (?,?,?,?,?,?)');

  const bagDescriptions = ['Mala preta rígida', 'Mala azul com rodas', 'Mochila cinza', 'Mala vermelha média', 'Bolsa de viagem bege', 'Mala grande prata'];
  const bagStatuses = ['checked', 'checked', 'checked', 'loaded', 'in-transit', 'arrived', 'arrived', 'delayed', 'missing', 'damaged'];

  for (let i = 0; i < 400; i++) {
    const pnr = pick(pnrLocators);
    const bagStatus = pick(bagStatuses);
    const tagNum = `AO-BAG-${uuid().slice(0, 8).toUpperCase()}`;
    const daysMissing = bagStatus === 'missing' ? randomInt(1, 10) : bagStatus === 'delayed' ? randomInt(1, 3) : 0;
    const pirNum = (bagStatus === 'missing' || bagStatus === 'delayed' || bagStatus === 'damaged') ? `PIR-${faker.date.recent().getFullYear()}-${String(randomInt(1, 9999)).padStart(4, '0')}` : null;

    stmtBag.run(tagNum, pnr, null, null, randomInt(8, 32), bagStatus, pick(AIRPORTS).code, pirNum, pick(bagDescriptions), daysMissing);

    if (bagStatus !== 'checked') {
      stmtBagEvt.run(uuid(), tagNum, faker.date.recent().toISOString(), pick(AIRPORTS).code, bagStatus === 'missing' ? 'last_scan' : 'scan', `Bagagem ${bagStatus}`);
    }
  }

  // ---- 5. Support Cases + AI Telemetry ----
  const stmtCase = db.prepare('INSERT INTO support_cases (case_id, pnr, customer_id, scenario_id, priority, case_status, opened_channel, assigned_to, opened_at, resolved_at, csat_score) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const stmtSession = db.prepare('INSERT INTO agent_sessions (session_id, case_id, customer_id, pnr, channel, started_at, ended_at, session_status, authenticated, auth_level, total_messages, resolution_type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const stmtToolCall = db.prepare('INSERT INTO agent_tool_calls (id, session_id, tool_name, input_summary, output_summary, success, latency_ms, created_at) VALUES (?,?,?,?,?,?,?,?)');
  const stmtLatency = db.prepare('INSERT INTO agent_latency (id, session_id, llm_latency_ms, tool_latency_ms, total_turn_latency_ms, created_at) VALUES (?,?,?,?,?,?)');
  const stmtOutcome = db.prepare('INSERT INTO agent_resolution_outcomes (id, session_id, case_id, intent, resolution_type, resolved_by, human_handoff, customer_accepted, refund_avoided, voucher_cost, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const stmtQA = db.prepare('INSERT INTO qa_scores (id, session_id, accuracy_score, policy_compliance_score, empathy_score, hallucination_detected, review_status) VALUES (?,?,?,?,?,?,?)');

  for (let i = 0; i < TOTAL_CASES; i++) {
    const pnr = pick(pnrLocators);
    const customerId = pnrCustomerMap[pnr] || `CUST${randomInt(0, TOTAL_PNRS)}`;
    const scenario = pick(SCENARIOS);
    const channel = pick(CHANNELS);
    const caseId = `CAS-${faker.string.alphanumeric(8).toUpperCase()}`;
    const openedAt = faker.date.recent({ days: 30 });
    const resolvedAt = new Date(openedAt.getTime() + randomInt(60000, 3600000));
    const caseStatus = pick(['resolved', 'resolved', 'resolved', 'escalated', 'closed']);
    const csat = pick([3, 4, 4, 4, 5, 5, 5, 5, 1, 2]);
    const priority = scenario === 'cancellation' || scenario === 'overbooking' ? 'high' : scenario === 'status' ? 'low' : 'medium';

    stmtCase.run(caseId, pnr, customerId, scenario, priority, caseStatus, channel, caseStatus === 'escalated' ? 'human' : 'ai_agent', openedAt.toISOString(), resolvedAt.toISOString(), csat);

    // AI Session
    const sessId = uuid();
    const handoff = caseStatus === 'escalated' ? 1 : 0;
    const msgs = randomInt(3, 15);
    const resType = handoff ? 'escalated' : pick(['info_provided', 'rebooking', 'voucher_issued', 'refund_processed', 'refund_denied']);

    stmtSession.run(sessId, caseId, customerId, pnr, channel, openedAt.toISOString(), resolvedAt.toISOString(), 'completed', 1, 'pnr_lastname', msgs, resType);

    // Tool calls (1-3 per session)
    const toolCount = randomInt(1, 3);
    for (let t = 0; t < toolCount; t++) {
      const toolName = pick(['lookup_pnr', 'get_anac_rules', 'get_flight_status', 'execute_action', 'check_refund_eligibility']);
      stmtToolCall.run(uuid(), sessId, toolName, `pnr=${pnr}`, 'success', 1, randomInt(100, 800), openedAt.toISOString());
    }

    // Latency
    const llmLat = randomInt(400, 2000);
    const toolLat = randomInt(100, 500);
    stmtLatency.run(uuid(), sessId, llmLat, toolLat, llmLat + toolLat, openedAt.toISOString());

    // Outcome
    const refundAvoided = resType === 'voucher_issued' ? randomInt(200, 2000) : 0;
    const voucherCost = resType === 'voucher_issued' ? randomInt(30, 100) : 0;
    stmtOutcome.run(uuid(), sessId, caseId, scenario, resType, handoff ? 'human' : 'ai', handoff, 1, refundAvoided, voucherCost, resolvedAt.toISOString());

    // QA
    stmtQA.run(uuid(), sessId, 0.8 + Math.random() * 0.2, 0.9 + Math.random() * 0.1, 0.7 + Math.random() * 0.3, 0, 'auto_approved');
  }

  db.exec('COMMIT');

  // Print summary
  const counts = {
    flights: (db.prepare('SELECT COUNT(*) as c FROM flight_segments').get() as any).c,
    pnrs: (db.prepare('SELECT COUNT(*) as c FROM pnr_reservations').get() as any).c,
    passengers: (db.prepare('SELECT COUNT(*) as c FROM passengers').get() as any).c,
    tickets: (db.prepare('SELECT COUNT(*) as c FROM tickets').get() as any).c,
    cases: (db.prepare('SELECT COUNT(*) as c FROM support_cases').get() as any).c,
    sessions: (db.prepare('SELECT COUNT(*) as c FROM agent_sessions').get() as any).c,
    baggage: (db.prepare('SELECT COUNT(*) as c FROM baggage_items').get() as any).c,
    irops: (db.prepare('SELECT COUNT(*) as c FROM irregular_operations').get() as any).c,
  };

  console.log(`\n✅ Data Factory Completa!`);
  console.log(`   ✈️  ${counts.flights} Voos`);
  console.log(`   📋 ${counts.pnrs} PNRs`);
  console.log(`   👤 ${counts.passengers} Passageiros`);
  console.log(`   🎫 ${counts.tickets} Tickets`);
  console.log(`   🧳 ${counts.baggage} Bagagens`);
  console.log(`   ⚠️  ${counts.irops} IROPs`);
  console.log(`   📞 ${counts.cases} Casos de Suporte`);
  console.log(`   🤖 ${counts.sessions} Sessões IA\n`);
}

// Run if called directly
if (process.argv[1]?.endsWith('factory.ts')) {
  runDataFactory();
}
