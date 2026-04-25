import { PNR, FlightSegment } from '../types/airline.js';

// ==========================================
// AirOps AI — Backend Database Mock (PSS/DCS)
// ==========================================

const flights: FlightSegment[] = [
  {
    id: 'FL001',
    flightNumber: 'AO1234',
    airline: 'AirOps',
    origin: { code: 'GRU', name: 'Guarulhos', city: 'São Paulo', terminal: '2' },
    destination: { code: 'GIG', name: 'Galeão', city: 'Rio de Janeiro', terminal: '2' },
    scheduledDeparture: '2023-11-20T10:00:00Z',
    scheduledArrival: '2023-11-20T11:00:00Z',
    status: 'delayed',
    delayMinutes: 120,
    delayReason: 'Manutenção não programada na aeronave',
    gate: 'A12',
    fareClass: 'economy'
  },
  {
    id: 'FL002',
    flightNumber: 'AO5678',
    airline: 'AirOps',
    origin: { code: 'CGH', name: 'Congonhas', city: 'São Paulo' },
    destination: { code: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro' },
    scheduledDeparture: '2023-11-21T15:00:00Z',
    status: 'on-time',
    gate: '3',
    fareClass: 'business'
  }
];

const pnrs: PNR[] = [
  {
    locator: 'ABC123',
    status: 'confirmed',
    createdAt: '2023-11-01T10:00:00Z',
    passengers: [
      {
        id: 'PAX1',
        firstName: 'Carlos',
        lastName: 'Silva',
        email: 'carlos@example.com',
        phone: '+5511999999999',
        documentType: 'cpf',
        documentNumber: '11122233344',
        loyaltyTier: 'gold',
      }
    ],
    segments: [flights[0]],
    tickets: [
      {
        eTicket: '9991234567890',
        fareClass: 'economy',
        fareBasis: 'BLE123',
        status: 'active',
        amount: 850.00,
        currency: 'BRL',
        fareRules: {
          changeFee: 0,
          cancelFee: 150,
          refundable: true,
          creditEligible: true,
          changeAllowed: true,
          noShowFee: 300
        }
      }
    ],
    contact: { email: 'carlos@example.com', phone: '+5511999999999' }
  }
];

export const db = {
  findPNR: (locator: string): PNR | undefined => {
    return pnrs.find(pnr => pnr.locator.toUpperCase() === locator.toUpperCase());
  },
  findFlight: (flightNumber: string): FlightSegment | undefined => {
    return flights.find(f => f.flightNumber.toUpperCase() === flightNumber.toUpperCase());
  },
  updatePNRStatus: (locator: string, status: PNR['status']): boolean => {
    const pnr = pnrs.find(p => p.locator.toUpperCase() === locator.toUpperCase());
    if (pnr) {
      pnr.status = status;
      return true;
    }
    return false;
  }
};
