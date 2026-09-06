const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const { checkConfiguration } = require('./services/cloudinary.service');

const app = express();
const PORT = process.env.PORT || 4002;
const isProd = process.env.NODE_ENV === 'production';

console.log('\n🔍 Vérification de la configuration Cloudinary...');
checkConfiguration();

const productRoutes = require('./routes.product');
const categoryRoutes = require('./routes.category');
const authRoutes = require('./routes.auth');
const dashboardRoutes = require('./routes.dashboard');
const orderRoutes = require('./routes.orders');
const customerRoutes = require('./routes.customers');
const promotionRoutes = require('./routes.promotions');
const reviewRoutes = require('./routes.reviews');
const sellerRoutes = require('./routes.sellers');
const accountRoutes = require('./routes.account');
const paymentRoutes = require('./routes.payment');
const shippingRoutes = require('./routes.shipping');

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://frontend:3000',
  'http://frontend:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://mandemarket-frontend:3001',
  'https://mandemarket.soubadigital.com',
  'https://apimandemarket.soubadigital.com',
];

if (process.env.CORS_ORIGIN) {
  for (const o of process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
  }
}

function isOriginAllowed(origin) {
  return !origin || allowedOrigins.includes(origin);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(compression());

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Origine refusée: ${origin}`);
    return callback(new Error('Origine non autorisée par CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const globalLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez plus tard' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives d’authentification' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes de paiement' },
});

app.use(globalLimiter);

// Corps brut pour vérification HMAC des webhooks (AVANT express.json)
app.use('/api/payment/webhook/stripe', express.raw({ type: 'application/json' }));
app.use('/api/payment/webhook/paystack', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/account/login', authLimiter);
app.use('/api/account/register', authLimiter);
app.use('/api/account', accountRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/shipping', shippingRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'MandeMarket API opérationnelle',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

app.use((err, req, res, next) => {
  if (err?.message === 'Origine non autorisée par CORS') {
    return res.status(403).json({ error: 'Origine non autorisée' });
  }
  console.error(err.stack || err);
  res.status(500).json({
    error: 'Une erreur interne s\'est produite',
    message: isProd ? 'Erreur serveur' : err.message,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MandeMarket Backend v2.0 — port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;
