// ==========================================
// AirOps AI — Express Server Entry Point
// ==========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import chatRouter from './routes/chat.js';
import voiceRouter from './routes/voice.js';
import analyticsRouter from './routes/analytics.js';
import pnrRouter from './routes/pnr.js';
import flightsRouter from './routes/flights.js';
import integrationsRouter from './routes/integrations.js';
import sacRouter from './routes/sac.js';
import { runDataFactory } from './db/factory.js';
import { seedDemoScenarios } from './db/seed-scenarios.js';
import { db } from './db/sqlite.js';
import { compileRAG } from './services/rag.js';

const app = express();

// ---- Security middleware ----
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ---- Request logging ----
app.use((req, _res, next) => {
  if (env.LOG_LEVEL === 'debug') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    security: {
      piiMasking: env.PII_MASKING_ENABLED,
      safetyInjection: env.SAFETY_INJECTION_ENABLED,
      outputGuardrails: env.OUTPUT_GUARDRAILS_ENABLED,
    },
  });
});

// ---- API Routes ----
app.use('/api/chat', chatRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/pnr', pnrRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/sac', sacRouter);

// ---- Error handling ----
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ---- Start server ----
app.listen(env.PORT, async () => {
  console.log(`
  ✈️  AirOps AI Server v3.0.0
  ──────────────────────────
  🌐 http://localhost:${env.PORT}
  📡 Environment: ${env.NODE_ENV}
  🔒 Security Layers:
     • PII Masking: ${env.PII_MASKING_ENABLED ? '✅' : '❌'}
     • Safety Injection: ${env.SAFETY_INJECTION_ENABLED ? '✅' : '❌'}
     • Output Guardrails: ${env.OUTPUT_GUARDRAILS_ENABLED ? '✅' : '❌'}
  ──────────────────────────
  `);

  // Check if DB needs seeding
  try {
    const caseCount = db.prepare('SELECT COUNT(*) as c FROM support_cases').get() as { c: number };
    if (caseCount.c === 0) {
      runDataFactory();
      seedDemoScenarios();
    }
  } catch {
    // Tables might not exist yet
    runDataFactory();
    seedDemoScenarios();
  }

  // Compile RAG
  await compileRAG();
});

export default app;
