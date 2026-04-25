// ==========================================
// AirOps AI — PNR API Route
// ==========================================
import { Router } from 'express';
import { securePnrLookup } from '../services/authEngine.js';
import { evaluateFlightDisruption, evaluateRefundEligibility, evaluateBaggageRights } from '../services/decisionEngine.js';
import { db } from '../db/sqlite.js';

const router = Router();

// GET /api/pnr/:locator
router.get('/:locator', (req, res) => {
  try {
    const { locator } = req.params;
    const result = securePnrLookup(locator.toUpperCase());
    if (!result.found) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json(result.pnr);
  } catch (error) {
    console.error('PNR lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pnr/:locator/rights — ANAC rights for current flight status
router.get('/:locator/rights', (req, res) => {
  try {
    const { locator } = req.params;
    const result = securePnrLookup(locator.toUpperCase());
    if (!result.found) {
      res.status(404).json({ error: result.error });
      return;
    }

    const pnr = result.pnr;
    const rights = [];

    for (const seg of pnr.segments || []) {
      const isCancelled = seg.segment_status === 'cancelled';
      const delayMin = seg.delay_minutes || 0;
      const disruption = evaluateFlightDisruption(delayMin, isCancelled, false);
      rights.push({ flightNumber: seg.flight_number, origin: seg.origin, destination: seg.destination, ...disruption });
    }

    // Baggage rights
    const baggageRights = (pnr.baggage || []).filter((b: any) => b.baggage_status === 'missing' || b.baggage_status === 'delayed').map((b: any) => {
      return evaluateBaggageRights(true, b.days_missing || 0);
    });

    // Refund eligibility
    let refundEligibility = null;
    if (pnr.tickets?.length > 0) {
      const ticket = pnr.tickets[0];
      const hasIROP = pnr.segments?.some((s: any) => s.segment_status === 'cancelled' || s.delay_minutes >= 240);
      refundEligibility = evaluateRefundEligibility(
        { refundable: !!ticket.refundable, change_fee: ticket.change_fee || 0, cancel_fee: ticket.cancel_fee || 0, voucher_allowed: !!ticket.voucher_allowed, fare_family: ticket.fare_family || 'basic' },
        hasIROP ? 'involuntary' : 'voluntary',
        ticket.total_amount || 0
      );
    }

    res.json({ locator, flightRights: rights, baggageRights, refundEligibility });
  } catch (error) {
    console.error('Rights evaluation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
