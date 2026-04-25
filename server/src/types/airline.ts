// ==========================================
// AirOps AI — Airline Domain Types
// ==========================================

export type FlightStatus = 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'landed' | 'departed' | 'diverted';
export type BaggageStatus = 'checked' | 'loaded' | 'in-transit' | 'arrived' | 'delayed' | 'missing' | 'damaged' | 'found';
export type LoyaltyTier = 'standard' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type FareClass = 'economy' | 'premium-economy' | 'business' | 'first';
export type PNRStatus = 'confirmed' | 'waitlisted' | 'cancelled' | 'suspended' | 'pending-payment';
export type RefundStatus = 'requested' | 'processing' | 'approved' | 'rejected' | 'completed';
export type CaseStatus = 'open' | 'in-progress' | 'resolved' | 'escalated' | 'closed';
export type DisruptionType = 'delay' | 'cancellation' | 'diversion' | 'overbooking' | 'gate-change' | 'equipment-change';
export type AssistanceLevel = 'communication' | 'food' | 'accommodation' | 'full';

export interface Airport {
  code: string;
  name: string;
  city: string;
  terminal?: string;
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  cpf?: string;
  email: string;
  phone: string;
  documentType: 'cpf' | 'passport';
  documentNumber: string;
  loyaltyTier: LoyaltyTier;
  loyaltyNumber?: string;
  loyaltyMiles?: number;
  specialNeeds?: string[];
}

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: string;
  origin: Airport;
  destination: Airport;
  scheduledDeparture: string;
  scheduledArrival?: string;
  actualDeparture?: string;
  actualArrival?: string;
  status: FlightStatus;
  gate?: string;
  terminal?: string;
  aircraft?: string;
  fareClass: FareClass;
  seatNumber?: string;
  delayMinutes?: number;
  delayReason?: string;
}

export interface PNR {
  locator: string;
  status: PNRStatus;
  createdAt: string;
  passengers: Passenger[];
  segments: FlightSegment[];
  tickets: Ticket[];
  contact: {
    email: string;
    phone: string;
  };
}

export interface Ticket {
  eTicket: string;
  fareClass: FareClass;
  fareBasis: string;
  fareRules: FareRule;
  status: 'active' | 'exchanged' | 'refunded' | 'void';
  amount: number;
  currency: string;
}

export interface FareRule {
  changeFee: number;
  cancelFee: number;
  refundable: boolean;
  creditEligible: boolean;
  changeAllowed: boolean;
  noShowFee: number;
  advancePurchase?: number;
}

export interface BaggageItem {
  tagNumber: string;
  weight: number;
  status: BaggageStatus;
  pirNumber?: string;
  lastLocation?: string;
  description?: string;
  daysMissing?: number;
}

export interface SupportCase {
  caseId: string;
  pnr: string;
  scenarioId: string;
  status: CaseStatus;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  csat?: number;
  channel: 'voice' | 'chat' | 'whatsapp' | 'app';
}

export interface FlightStatusEvent {
  flightNumber: string;
  eventType: DisruptionType;
  timestamp: string;
  delayMinutes?: number;
  reasonCode?: string;
  reasonDescription?: string;
  newGate?: string;
  newTerminal?: string;
  affectedPassengers?: number;
}

export interface IROPEvent {
  id: string;
  flightNumber: string;
  type: DisruptionType;
  severity: 'low' | 'medium' | 'high';
  startedAt: string;
  delayMinutes?: number;
  reason: string;
  assistanceLevelRequired: AssistanceLevel;
  affectedPassengers: number;
  alternativeFlights?: string[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: 'credit-card' | 'debit' | 'pix' | 'voucher' | 'miles';
  status: 'approved' | 'pending' | 'failed' | 'refunded';
  timestamp: string;
}

export interface Refund {
  id: string;
  ticketNumber: string;
  type: 'voluntary' | 'involuntary';
  amount: number;
  currency: string;
  status: RefundStatus;
  requestedAt: string;
  processedAt?: string;
  reason?: string;
}

export interface Voucher {
  code: string;
  type: 'flight-credit' | 'meal' | 'hotel' | 'transport' | 'goodwill';
  amount: number;
  currency: string;
  validUntil: string;
  used: boolean;
}
