import express from 'express';
import { v4 as uuid } from 'uuid';

const router = express.Router();

// Mock: Plataforma de Hospedagem (HotelBeds / SleepWell Corporate API)
router.post('/hotel/book', (req, res) => {
  const { pnr, passengers, city, nights } = req.body;
  
  // Simulate delay
  setTimeout(() => {
    res.json({
      status: 'success',
      reservationId: `HB-${uuid().slice(0, 8).toUpperCase()}`,
      provider: 'SleepWell Corporate',
      hotel: 'Ibis Budget Aeroporto',
      city: city || 'POA',
      nights: nights || 1,
      rooms: Math.ceil((passengers?.length || 1) / 2),
      voucherPdf: `https://dummy-hotel-voucher.airops.local/voucher_${pnr}.pdf`,
      message: 'Reserva confirmada. Voucher enviado ao passageiro.',
    });
  }, 500);
});

// Mock: Plataforma de Voucher Alimentação (FoodPass / iFood Corporate)
router.post('/food/voucher', (req, res) => {
  const { pnr, amount, quantity, contactEmail, contactPhone } = req.body;

  setTimeout(() => {
    const codes = Array.from({ length: quantity || 1 }).map(() => `FP-${uuid().slice(0, 6).toUpperCase()}`);
    res.json({
      status: 'success',
      provider: 'FoodPass Corporate',
      amountPerVoucher: amount || 150.00,
      codes,
      message: `Vouchers enviados com sucesso via SMS para ${contactPhone || 'passageiro'} e Email para ${contactEmail || 'passageiro'}.`,
    });
  }, 300);
});

// Mock: Plataforma de Reembolso e Indenização (AirOps PayGateway)
router.post('/refund/process', (req, res) => {
  const { pnr, passengerId, amount, type, method, pixKey } = req.body; // type: 'full_refund', 'compensation', 'fare_difference'

  setTimeout(() => {
    res.json({
      status: 'success',
      transactionId: `TXN-${uuid()}`,
      processedAmount: amount,
      currency: 'BRL',
      method: method || 'PIX',
      estimatedArrival: method === 'PIX' ? 'Instant' : '3-5 business days',
      message: 'Reembolso/Indenização processada com sucesso no sistema financeiro.',
    });
  }, 800);
});

// Mock: Transporte Terrestre (RideCorp API)
router.post('/transport/ride', (req, res) => {
  const { pnr, origin, destination, passengersType } = req.body; // origin: 'GRU', dest: 'home_address'

  setTimeout(() => {
    res.json({
      status: 'success',
      rideId: `RIDE-${uuid().slice(0, 8)}`,
      provider: 'RideCorp VIP',
      vehicle: passengersType === 'large_group' ? 'Van (15 seats)' : 'Sedan Executive',
      driver: 'Carlos M.',
      eta: '10 mins',
      pickupLocation: `Terminal de Desembarque ${origin || 'Aeroporto'}`,
      message: 'Transporte acionado. Motorista a caminho.',
    });
  }, 400);
});

// Mock: Atendimento de Emergência Médica/Seguro (MedAssist Global)
router.post('/medical/notify', (req, res) => {
  const { pnr, flightId, severity, description, location } = req.body;

  setTimeout(() => {
    res.json({
      status: 'critical_response_initiated',
      caseId: `MED-${Date.now()}`,
      provider: 'MedAssist Global',
      action: severity === 'high' ? 'Ambulância enviada para a pista' : 'Equipe médica aguardando no portão',
      eta: 'Imediato',
      location: location,
      message: 'Protocolo médico acionado com prioridade máxima.',
    });
  }, 200);
});

export default router;
