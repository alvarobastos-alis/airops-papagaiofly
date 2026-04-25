// ==========================================
// AirOps AI — Massive Data Seeder
// ==========================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { FlightSegment, PNR, SupportCase } from '../types/airline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const airports = [
  { code: 'GRU', name: 'Guarulhos', city: 'São Paulo', terminal: '2' },
  { code: 'CGH', name: 'Congonhas', city: 'São Paulo' },
  { code: 'GIG', name: 'Galeão', city: 'Rio de Janeiro', terminal: '2' },
  { code: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro' },
  { code: 'BSB', name: 'Brasília', city: 'Brasília' },
  { code: 'CNF', name: 'Confins', city: 'Belo Horizonte' },
  { code: 'VCP', name: 'Viracopos', city: 'Campinas' },
  { code: 'SSA', name: 'Dep. Luís Eduardo Magalhães', city: 'Salvador' },
  { code: 'REC', name: 'Guararapes', city: 'Recife' },
  { code: 'FOR', name: 'Pinto Martins', city: 'Fortaleza' },
];

function generateFlights(count = 100): FlightSegment[] {
  const flights: FlightSegment[] = [];
  const statuses: FlightSegment['status'][] = ['on-time', 'delayed', 'cancelled', 'boarding', 'landed'];
  
  for (let i = 0; i < count; i++) {
    const origin = faker.helpers.arrayElement(airports);
    let destination = faker.helpers.arrayElement(airports);
    while (destination.code === origin.code) {
      destination = faker.helpers.arrayElement(airports);
    }
    
    const statusIdx = faker.number.int({ min: 0, max: 100 });
    let status: FlightSegment['status'] = 'on-time';
    if (statusIdx > 90) status = 'cancelled';
    else if (statusIdx > 75) status = 'delayed';
    else if (statusIdx > 65) status = 'boarding';
    else if (statusIdx > 55) status = 'landed';

    const isDelayed = status === 'delayed';
    
    flights.push({
      id: faker.string.uuid(),
      flightNumber: `AO${faker.number.int({ min: 1000, max: 9999 })}`,
      airline: 'AirOps',
      origin,
      destination,
      scheduledDeparture: faker.date.soon({ days: 2 }).toISOString(),
      status,
      delayMinutes: isDelayed ? faker.number.int({ min: 15, max: 240 }) : undefined,
      delayReason: isDelayed ? faker.helpers.arrayElement(['Manutenção programada', 'Condições climáticas', 'Atendimento médico', 'Tráfego aéreo']) : undefined,
      gate: faker.helpers.arrayElement(['A1', 'A12', 'B3', 'C14', 'D9']),
      aircraft: faker.helpers.arrayElement(['Boeing 737-800', 'Airbus A320neo', 'Embraer E195-E2']),
      fareClass: faker.helpers.arrayElement(['economy', 'business']),
    });
  }
  return flights;
}

function generatePNRs(flights: FlightSegment[], count = 500): PNR[] {
  const pnrs: PNR[] = [];
  for (let i = 0; i < count; i++) {
    const paxCount = faker.number.int({ min: 1, max: 4 });
    const passengers = [];
    
    for (let j = 0; j < paxCount; j++) {
      passengers.push({
        id: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        cpf: faker.number.int({ min: 10000000000, max: 99999999999 }).toString(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        documentType: 'cpf' as const,
        documentNumber: faker.number.int({ min: 10000000000, max: 99999999999 }).toString(),
        loyaltyTier: faker.helpers.arrayElement(['standard', 'silver', 'gold', 'platinum']),
      });
    }

    const flightCount = faker.number.int({ min: 1, max: 2 });
    const segments = faker.helpers.arrayElements(flights, flightCount);
    
    pnrs.push({
      locator: faker.string.alphanumeric(6).toUpperCase(),
      status: faker.helpers.arrayElement(['confirmed', 'cancelled', 'pending-payment']),
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      passengers,
      segments,
      tickets: [],
      contact: {
        email: passengers[0].email,
        phone: passengers[0].phone,
      }
    });
  }
  return pnrs;
}

function generateCases(pnrs: PNR[], count = 2000): SupportCase[] {
  const cases: SupportCase[] = [];
  
  for (let i = 0; i < count; i++) {
    const pnr = faker.helpers.arrayElement(pnrs);
    const createdAt = faker.date.recent({ days: 60 });
    const resolvedAt = new Date(createdAt.getTime() + faker.number.int({ min: 60000, max: 3600000 }));
    
    cases.push({
      caseId: `CAS-${faker.string.alphanumeric(8).toUpperCase()}`,
      pnr: pnr.locator,
      scenarioId: faker.helpers.arrayElement(['delay', 'cancellation', 'baggage', 'refund', 'status', 'change', 'booking']),
      status: faker.helpers.arrayElement(['resolved', 'escalated', 'closed']),
      createdAt: createdAt.toISOString(),
      resolvedAt: resolvedAt.toISOString(),
      csat: faker.helpers.arrayElement([3, 4, 4, 5, 5, 5, 5, 1, 2]),
      channel: faker.helpers.arrayElement(['voice', 'chat', 'whatsapp']),
    });
  }
  return cases;
}

export function runSeeder() {
  console.log('🌱 Planteando sementes massivas de dados...');
  const flights = generateFlights(150);
  const pnrs = generatePNRs(flights, 2000);
  const cases = generateCases(pnrs, 8000);

  fs.writeFileSync(path.join(DATA_DIR, 'flights.json'), JSON.stringify(flights, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'pnrs.json'), JSON.stringify(pnrs, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'cases.json'), JSON.stringify(cases, null, 2));

  console.log(`✅ Seed completo:`);
  console.log(`- ${flights.length} Voos`);
  console.log(`- ${pnrs.length} PNRs`);
  console.log(`- ${cases.length} Casos de Suporte Logados`);
}

// Allow running via node directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
   runSeeder();
}
