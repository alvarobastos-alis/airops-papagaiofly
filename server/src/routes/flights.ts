// ==========================================
// AirOps AI — Flights API Route
// ==========================================
import { Router } from 'express';
import { db } from '../db/sqlite.js';

const router = Router();

// GET /api/flights — list flights with filters
router.get('/', (req, res) => {
  try {
    const { status, origin, destination, limit = '50' } = req.query;
    let query = 'SELECT * FROM flight_segments WHERE 1=1';
    const params: any[] = [];

    if (status) { query += ' AND segment_status = ?'; params.push(status); }
    if (origin) { query += ' AND origin = ?'; params.push(origin); }
    if (destination) { query += ' AND destination = ?'; params.push(destination); }
    query += ' ORDER BY scheduled_departure DESC LIMIT ?';
    params.push(Number(limit));

    const flights = db.prepare(query).all(...params);
    res.json(flights);
  } catch (error) {
    console.error('Flights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/flights/disruptions — active disruptions
router.get('/disruptions', (_req, res) => {
  try {
    const disruptions = db.prepare(`
      SELECT io.*, fs.flight_number, fs.origin, fs.destination, fs.scheduled_departure
      FROM irregular_operations io
      JOIN flight_segments fs ON io.flight_id = fs.id
      ORDER BY io.started_at DESC
      LIMIT 20
    `).all();
    res.json(disruptions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/flights/:id/events
router.get('/:id/events', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM flight_status_events WHERE flight_id = ? ORDER BY timestamp DESC').all(req.params.id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
