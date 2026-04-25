// ==========================================
// AirOps AI — Environment Configuration
// Validates all required env vars at startup
// ==========================================

import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_REALTIME_MODEL: z.string().default('gpt-4o-realtime-preview-2024-12-17'),
  OPENAI_REALTIME_VOICE: z.string().default('alloy'),

  // Database (optional for MVP)
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // Security flags
  PII_MASKING_ENABLED: z.coerce.boolean().default(true),
  SAFETY_INJECTION_ENABLED: z.coerce.boolean().default(true),
  OUTPUT_GUARDRAILS_ENABLED: z.coerce.boolean().default(true),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map(i => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
    console.error(`\n❌ Missing or invalid environment variables:\n${missing}\n`);
    console.error('💡 Copy .env.example to .env and fill in the values.\n');

    // In development, allow startup with warnings
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Running in development mode with defaults...\n');
      return envSchema.parse({
        ...process.env,
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_placeholder',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-placeholder',
      });
    }
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
