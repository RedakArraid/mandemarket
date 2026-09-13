const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4002),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET doit contenir au moins 16 caractères'),
  REFRESH_TOKEN_SECRET: z.string().min(16).optional(),
  COOKIE_SECRET: z.string().default('mande-default-cookie-secret-change-prod'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://frontend:3000,http://127.0.0.1:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Médias (Cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Passerelles de paiement
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  CINETPAY_API_KEY: z.string().optional(),
  CINETPAY_SITE_ID: z.string().optional(),

  // Emails transactionnels
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('MandeMarket <noreply@mandemarket.com>'),
  ADMIN_EMAIL: z.string().email().default('admin@mandemarket.com'),

  // URLs
  NEXT_PUBLIC_SITE_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().default('http://localhost:4002')
});

function loadConfig() {
  if (process.env.NODE_ENV === 'test') {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'postgresql://postgres:mandemarket123@localhost:5433/mandemarket';
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'super-secure-test-jwt-secret-key-minimum-32-chars';
    }
  }
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'postgresql://postgres:mandemarket123@localhost:5433/mandemarket';
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'dev-jwt-secret-mande-market-scalable-local-key-32';
    }
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ ERREUR DE CONFIGURATION : Variables d\'environnement invalides :');
    console.error(JSON.stringify(result.error.format(), null, 2));
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw new Error('Variables d\'environnement invalides');
  }

  const env = result.data;

  // Validation supplémentaire en production
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.includes('changeme') || env.JWT_SECRET.includes('secret-key-change')) {
      console.error('❌ ERREUR CRITIQUE : Le JWT_SECRET en production utilise une valeur par défaut !');
      process.exit(1);
    }
  }

  return env;
}

const config = loadConfig();

module.exports = config;
