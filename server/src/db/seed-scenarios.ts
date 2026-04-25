// ==========================================
// AirOps AI — Demo Scenario Seeder
// Creates 10 known PNRs for testing/demo
// ==========================================
import { db, runMigrations } from './sqlite.js';
import { v4 as uuid } from 'uuid';

const DEMO_PNRS = [
  {
    locator: 'XKRM47', customer: 'CUST_XKRM47', firstName: 'Carlos', lastName: 'Mendes',
    email: 'carlos.mendes@email.com', phone: '+55 11 99876-5432', cpf: '123.456.789-00',
    tier: 'gold', miles: 85400,
    flight: { number: 'AO1234', origin: 'GRU', dest: 'GIG', status: 'on-time', delay: 0 },
    fare: 'PLUS', amount: 890, scenario: 'Happy path — voo no horário',
  },
  {
    locator: 'TBVN83', customer: 'CUST_TBVN83', firstName: 'Maria', lastName: 'Silva',
    email: 'maria.silva@email.com', phone: '+55 21 98765-4321', cpf: '987.654.321-00',
    tier: 'standard', miles: 5200,
    flight: { number: 'AO1567', origin: 'GRU', dest: 'SSA', status: 'delayed', delay: 135 },
    fare: 'PLUS', amount: 1250, scenario: 'Atraso >2h (ANAC: alimentação)',
  },
  {
    locator: 'JPWQ56', customer: 'CUST_JPWQ56', firstName: 'Ana', lastName: 'Oliveira',
    email: 'ana.oliveira@email.com', phone: '+55 41 99887-6655', cpf: '456.789.123-00',
    tier: 'platinum', miles: 155000,
    flight: { number: 'AO3456', origin: 'GRU', dest: 'BSB', status: 'cancelled', delay: 0 },
    fare: 'MAX', amount: 2450, scenario: 'Voo cancelado (ANAC: full rights)',
  },
  {
    locator: 'MHFC92', customer: 'CUST_MHFC92', firstName: 'Roberto', lastName: 'Ferreira',
    email: 'roberto.f@email.com', phone: '+55 31 98765-1234', cpf: '789.123.456-00',
    tier: 'silver', miles: 42000,
    flight: { number: 'AO9012', origin: 'GRU', dest: 'EZE', status: 'delayed', delay: 280 },
    fare: 'FLEX', amount: 4200, scenario: 'Atraso >4h (ANAC: hospedagem + reacomodação)',
  },
  {
    locator: 'RNGS15', customer: 'CUST_RNGS15', firstName: 'Juliana', lastName: 'Costa',
    email: 'juliana.costa@email.com', phone: '+55 11 91234-5678', cpf: '321.654.987-00',
    tier: 'standard', miles: 3100,
    flight: { number: 'AO5678', origin: 'SSA', dest: 'REC', status: 'on-time', delay: 0 },
    fare: 'PLUS', amount: 520, scenario: 'Bagagem extraviada (dia 3 de 7)',
    baggage: { status: 'missing', daysMissing: 3, lastAirport: 'GRU' },
  },
  {
    locator: 'WDLA68', customer: 'CUST_WDLA68', firstName: 'Pedro', lastName: 'Santos',
    email: 'pedro.santos@email.com', phone: '+55 61 99876-4321', cpf: '654.987.321-00',
    tier: 'standard', miles: 800,
    flight: { number: 'AO2890', origin: 'CGH', dest: 'SDU', status: 'on-time', delay: 0 },
    fare: 'LIGHT', amount: 189, scenario: 'Tarifa LIGHT — pedido de reembolso (negar)',
  },
  {
    locator: 'FZEY74', customer: 'CUST_FZEY74', firstName: 'Fernanda', lastName: 'Lima',
    email: 'fernanda.lima@email.com', phone: '+55 85 99123-4567', cpf: '147.258.369-00',
    tier: 'gold', miles: 78000,
    flight: { number: 'AO4521', origin: 'GRU', dest: 'MIA', status: 'on-time', delay: 0 },
    fare: 'FLEX', amount: 12800, scenario: 'Overbooking (preterição)',
    overbooking: true,
  },
  {
    locator: 'GKTB29', customer: 'CUST_GKTB29', firstName: 'Lucas', lastName: 'Almeida',
    email: 'lucas.almeida@email.com', phone: '+55 51 98765-8765', cpf: '258.369.147-00',
    tier: 'silver', miles: 31000,
    flight: { number: 'AO6789', origin: 'BSB', dest: 'MAO', status: 'delayed', delay: 90 },
    fare: 'PLUS', amount: 1580, scenario: 'Conexão perdida por atraso do trecho anterior',
    connection: { nextFlight: 'AO7890', origin: 'MAO', dest: 'GRU', missed: true },
  },
  {
    locator: 'NLXP41', customer: 'CUST_NLXP41', firstName: 'Beatriz', lastName: 'Rodrigues',
    email: 'beatriz.r@email.com', phone: '+55 21 91234-9876', cpf: '369.147.258-00',
    tier: 'diamond', miles: 312000,
    flight: { number: 'AO7890', origin: 'GIG', dest: 'LIS', status: 'on-time', delay: 0 },
    fare: 'FLEX', amount: 18500, scenario: 'Cliente Diamond — atendimento prioritário',
  },
  {
    locator: 'SVQH03', customer: 'CUST_SVQH03', firstName: 'Thiago', lastName: 'Barbosa',
    email: 'thiago.b@email.com', phone: '+55 11 98888-1234', cpf: '111.222.333-44',
    tier: 'standard', miles: 500,
    flight: { number: 'AO8901', origin: 'CWB', dest: 'GRU', status: 'on-time', delay: 0 },
    fare: 'MAX', amount: 750, scenario: 'Possível fraude (risk_score alto)',
    fraud: true,
  },
  {
    locator: 'BQLR61', customer: 'CUST_BQLR61', firstName: 'Roberto', lastName: 'Gomes',
    email: 'roberto.g@email.com', phone: '+55 51 98888-7777', cpf: '123.123.123-11',
    tier: 'standard', miles: 1200,
    flight: { number: 'AO1122', origin: 'GRU', dest: 'POA', status: 'cancelled', delay: 0 },
    fare: 'LIGHT', amount: 850, scenario: 'Desastre Natural — Chuvas e alagamento em POA',
  },
  {
    locator: 'HYMA37', customer: 'CUST_HYMA37', firstName: 'Camila', lastName: 'Souza',
    email: 'camila.s@email.com', phone: '+55 19 97777-6666', cpf: '234.234.234-22',
    tier: 'gold', miles: 65000,
    flight: { number: 'AO2233', origin: 'VCP', dest: 'REC', status: 'cancelled', delay: 0 },
    fare: 'PLUS', amount: 1200, scenario: 'Acidente Aéreo — Evacuação em VCP',
  },
  {
    locator: 'PCTW85', customer: 'CUST_PCTW85', firstName: 'Marcelo', lastName: 'Dias',
    email: 'marcelo.d@email.com', phone: '+55 11 96666-5555', cpf: '345.345.345-33',
    tier: 'silver', miles: 28000,
    flight: { number: 'AO3344', origin: 'GRU', dest: 'SDU', status: 'delayed', delay: 400 },
    fare: 'FLEX', amount: 950, scenario: 'Falha Global de TI — Blecaute de Sistemas',
  },
  {
    locator: 'VKDF19', customer: 'CUST_VKDF19', firstName: 'Fernanda', lastName: 'Ribeiro',
    email: 'fernanda.r@email.com', phone: '+55 21 95555-4444', cpf: '456.456.456-44',
    tier: 'diamond', miles: 210000,
    flight: { number: 'AO4455', origin: 'GIG', dest: 'BSB', status: 'delayed', delay: 180 },
    fare: 'MAX', amount: 3200, scenario: 'Emergência Médica a Bordo — Divergência para BSB',
  },
  {
    locator: 'QZJL52', customer: 'CUST_QZJL52', firstName: 'Lucas', lastName: 'Martins',
    email: 'lucas.m@email.com', phone: '+55 11 94444-3333', cpf: '567.567.567-55',
    tier: 'standard', miles: 400,
    flight: { number: 'AO5566', origin: 'CGH', dest: 'SDU', status: 'cancelled', delay: 0 },
    fare: 'LIGHT', amount: 450, scenario: 'Greve de Trabalhadores — Voo cancelado na Ponte Aérea',
  },
  {
    locator: 'LWNE46', customer: 'CUST_LWNE46', firstName: 'Aline', lastName: 'Castro',
    email: 'aline.c@email.com', phone: '+55 41 93333-2222', cpf: '678.678.678-66',
    tier: 'silver', miles: 15000,
    flight: { number: 'AO6677', origin: 'CWB', dest: 'GRU', status: 'on-time', delay: 0 },
    fare: 'PLUS', amount: 680, scenario: 'PET Perdido/Óbito — Falha no porão',
    baggage: { status: 'missing', daysMissing: 1, lastAirport: 'CWB' },
  },
  {
    locator: 'DCPX78', customer: 'CUST_DCPX78', firstName: 'Ricardo', lastName: 'Alves',
    email: 'ricardo.a@email.com', phone: '+55 41 92222-1111', cpf: '789.789.789-77',
    tier: 'standard', miles: 2300,
    flight: { number: 'AO7788', origin: 'CWB', dest: 'CGH', status: 'delayed', delay: 250 },
    fare: 'LIGHT', amount: 550, scenario: 'Neblina Severa — Aeroporto de CWB fechado',
  },
  {
    locator: 'YSRG04', customer: 'CUST_YSRG04', firstName: 'Juliana', lastName: 'Moreira',
    email: 'juliana.m@email.com', phone: '+55 11 91111-0000', cpf: '890.890.890-88',
    tier: 'gold', miles: 55000,
    flight: { number: 'AO8899', origin: 'CGH', dest: 'CNF', status: 'delayed', delay: 300 },
    fare: 'MAX', amount: 1400, scenario: 'Incidente Operacional — Pneu estourado interditando pista',
  },
  {
    locator: 'AKWV33', customer: 'CUST_AKWV33', firstName: 'Bruno', lastName: 'Teixeira',
    email: 'bruno.t@email.com', phone: '+55 31 99999-8888', cpf: '901.901.901-99',
    tier: 'standard', miles: 150,
    flight: { number: 'AO9900', origin: 'CNF', dest: 'SSA', status: 'delayed', delay: 120 },
    fare: 'LIGHT', amount: 900, scenario: 'Passageiro Indisciplinado — Retorno ao gate',
  },
  {
    locator: 'EHUB57', customer: 'CUST_EHUB57', firstName: 'Patricia', lastName: 'Moura',
    email: 'patricia.m@email.com', phone: '+55 85 98888-6666', cpf: '012.012.012-00',
    tier: 'silver', miles: 32000,
    flight: { number: 'AO1020', origin: 'FOR', dest: 'GRU', status: 'cancelled', delay: 0 },
    fare: 'PLUS', amount: 1800, scenario: 'Falta de Tripulação — Crew Timeout',
  },
  {
    locator: 'NRTK82', customer: 'CUST_NRTK82', firstName: 'Eduardo', lastName: 'Lima',
    email: 'eduardo.l@email.com', phone: '+55 61 97777-5555', cpf: '123.456.789-12',
    tier: 'diamond', miles: 180000,
    flight: { number: 'AO2030', origin: 'BSB', dest: 'CGH', status: 'delayed', delay: 240 },
    fare: 'FLEX', amount: 2600, scenario: 'Manutenção Não Programada — AOG',
  },
  {
    locator: 'CJPS16', customer: 'CUST_CJPS16', firstName: 'Vanessa', lastName: 'Carvalho',
    email: 'vanessa.c@email.com', phone: '+55 85 96666-4444', cpf: '234.567.890-23',
    tier: 'standard', miles: 900,
    flight: { number: 'AO3040', origin: 'FOR', dest: 'REC', status: 'delayed', delay: 150 },
    fare: 'LIGHT', amount: 400, scenario: 'Choque com Pássaros — Bird Strike, retorno a FOR',
  },
  {
    locator: 'ZFMQ90', customer: 'CUST_ZFMQ90', firstName: 'Letícia', lastName: 'Silva',
    email: 'leticia.s@email.com', phone: '+55 92 95555-3333', cpf: '345.678.901-34',
    tier: 'gold', miles: 42000,
    flight: { number: 'AO4050', origin: 'MAO', dest: 'GRU', status: 'delayed', delay: 90 },
    fare: 'PLUS', amount: 1500, scenario: 'Trabalho de Parto a Bordo — Desvio médico',
  },
  {
    locator: 'BXWD65', customer: 'CUST_BXWD65', firstName: 'Gabriel', lastName: 'Costa', // UM
    email: 'responsavel.gabriel@email.com', phone: '+55 11 94444-2222', cpf: '456.789.012-45',
    tier: 'standard', miles: 0,
    flight: { number: 'AO5060', origin: 'VIX', dest: 'GRU', status: 'delayed', delay: 180 },
    fare: 'PLUS', amount: 1100, scenario: 'Menor Desacompanhado — Perdeu conexão em GRU',
    connection: { nextFlight: 'AO6070', origin: 'GRU', dest: 'CGB', missed: true },
  },
  {
    locator: 'KTHN28', customer: 'CUST_KTHN28', firstName: 'Thiago', lastName: 'Rocha',
    email: 'thiago.r@email.com', phone: '+55 11 93333-1111', cpf: '567.890.123-56',
    tier: 'silver', miles: 29000,
    flight: { number: 'AO7080', origin: 'GRU', dest: 'LIS', status: 'on-time', delay: 0 },
    fare: 'MAX', amount: 5500, scenario: 'Dano a Bagagem de Alto Valor — Equipamento destruído',
    baggage: { status: 'damaged', daysMissing: 0, lastAirport: 'LIS' },
  }
];

export function seedDemoScenarios() {
  console.log('🎬 Seeding 10 cenários demo pré-configurados...\n');
  runMigrations();

  const stmtPNR = db.prepare('INSERT OR REPLACE INTO pnr_reservations (locator, customer_id, booking_date, reservation_status, channel, trip_type, total_amount, currency, contact_email, contact_phone) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const stmtPax = db.prepare('INSERT OR REPLACE INTO passengers (id, pnr, customer_id, first_name, last_name, document_type, document_number, document_last4, email, phone, email_masked, phone_last4) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const stmtFlight = db.prepare('INSERT OR REPLACE INTO flight_segments (id, flight_number, airline, origin, destination, scheduled_departure, scheduled_arrival, segment_status, delay_minutes, delay_reason, gate, terminal, aircraft, cabin) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const stmtPnrSeg = db.prepare('INSERT OR REPLACE INTO pnr_segments (pnr, segment_id, sequence_number) VALUES (?,?,?)');
  const stmtTicket = db.prepare('INSERT OR REPLACE INTO tickets (ticket_number, pnr, passenger_id, segment_id, fare_basis, ticket_status, base_fare, taxes, total_amount) VALUES (?,?,?,?,?,?,?,?,?)');
  const stmtLoyalty = db.prepare('INSERT OR REPLACE INTO loyalty_profiles (customer_id, loyalty_id, tier, miles_balance, lifetime_value_score, priority_service) VALUES (?,?,?,?,?,?)');
  const stmtBag = db.prepare('INSERT OR REPLACE INTO baggage_items (tag_number, pnr, baggage_status, last_known_airport, pir_number, description, days_missing, weight_kg) VALUES (?,?,?,?,?,?,?,?)');
  const stmtFraud = db.prepare('INSERT OR REPLACE INTO fraud_alerts (id, customer_id, pnr, risk_type, risk_score, action_taken) VALUES (?,?,?,?,?,?)');
  const stmtIROP = db.prepare('INSERT OR REPLACE INTO irregular_operations (id, flight_id, irop_type, severity, started_at, reason_description, affected_passengers, regulatory_trigger, assistance_level) VALUES (?,?,?,?,?,?,?,?,?)');

  const now = new Date();

  for (const demo of DEMO_PNRS) {
    const paxId = `PAX_${demo.locator}`;
    const flightId = `FLT_${demo.locator}`;
    const dep = new Date(now.getTime() + 6 * 3600000); // 6h from now
    const arr = new Date(dep.getTime() + 3 * 3600000);
    const delayReason = demo.flight.delay > 0 ? 'Manutenção não programada' : (demo.flight.status === 'cancelled' ? 'Condições meteorológicas adversas' : null);

    stmtPNR.run(demo.locator, demo.customer, now.toISOString(), 'confirmed', 'website', 'one_way', demo.amount, 'BRL', demo.email, demo.phone);
    stmtPax.run(paxId, demo.locator, demo.customer, demo.firstName, demo.lastName, 'cpf', demo.cpf, demo.cpf.slice(-5).replace('-', ''), demo.email, demo.phone, demo.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), demo.phone.slice(-4));
    stmtFlight.run(flightId, demo.flight.number, 'AirOps', demo.flight.origin, demo.flight.dest, dep.toISOString(), arr.toISOString(), demo.flight.status, demo.flight.delay, delayReason, 'A12', '2', 'Airbus A320neo', 'economy');
    stmtPnrSeg.run(demo.locator, flightId, 1);
    stmtTicket.run(`955${demo.locator}001`, demo.locator, paxId, flightId, demo.fare, 'issued', demo.amount * 0.8, demo.amount * 0.2, demo.amount);

    const ltv = demo.tier === 'standard' ? 20 : demo.tier === 'silver' ? 50 : demo.tier === 'gold' ? 75 : 95;
    stmtLoyalty.run(demo.customer, `AO-${demo.tier.toUpperCase().slice(0, 4)}-${demo.locator}`, demo.tier, demo.miles, ltv, demo.tier === 'platinum' || demo.tier === 'diamond' ? 1 : 0);

    // Baggage scenario
    if (demo.baggage) {
      stmtBag.run(`AO-BAG-${demo.locator}`, demo.locator, demo.baggage.status, demo.baggage.lastAirport, `PIR-2026-${demo.locator}`, 'Mala preta rígida Samsonite', demo.baggage.daysMissing, 23);
    }

    // Fraud scenario
    if (demo.fraud) {
      stmtFraud.run(uuid(), demo.customer, demo.locator, 'refund_request_after_failed_auth', 0.82, 'require_human_review');
    }

    // IROPs
    if (demo.flight.status === 'cancelled' || demo.flight.delay >= 120) {
      const severity = demo.flight.status === 'cancelled' ? 'high' : demo.flight.delay >= 240 ? 'high' : 'medium';
      let assistLevel = 'none';
      let regTrigger = 'none';
      if (demo.flight.delay >= 60) { assistLevel = 'communication'; regTrigger = 'delay_above_1h'; }
      if (demo.flight.delay >= 120) { assistLevel = 'food'; regTrigger = 'delay_above_2h'; }
      if (demo.flight.delay >= 240 || demo.flight.status === 'cancelled') { assistLevel = 'full'; regTrigger = demo.flight.status === 'cancelled' ? 'cancellation' : 'delay_above_4h'; }

      stmtIROP.run(uuid(), flightId, demo.flight.status === 'cancelled' ? 'cancellation' : 'delay', severity, dep.toISOString(), delayReason, 156, regTrigger, assistLevel);
    }

    console.log(`   ✅ ${demo.locator} — ${demo.scenario}`);
  }

  // Ensure fare rules exist
  const fareCount = (db.prepare('SELECT COUNT(*) as c FROM fare_rules').get() as any).c;
  if (fareCount === 0) {
    const stmtFare = db.prepare('INSERT OR IGNORE INTO fare_rules (fare_basis, fare_family, refundable, change_allowed, change_fee, cancel_fee, no_show_penalty, voucher_allowed, free_rebooking_on_irop, baggage_included, baggage_weight_kg, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    stmtFare.run('LIGHT', 'light', 0, 0, 0, 0, 0, 0, 1, 0, 0, 'Tarifa Light');
    stmtFare.run('PLUS', 'plus', 0, 1, 150, 250, 500, 1, 1, 1, 23, 'Tarifa Plus');
    stmtFare.run('MAX', 'max', 1, 1, 0, 50, 200, 1, 1, 2, 23, 'Tarifa MAX');
    stmtFare.run('FLEX', 'flex', 1, 1, 0, 0, 100, 1, 1, 2, 32, 'Tarifa FLEX Business');
  }

  console.log('\n🎬 Demo scenarios prontos!\n');
}

if (process.argv[1]?.endsWith('seed-scenarios.ts')) {
  seedDemoScenarios();
}
