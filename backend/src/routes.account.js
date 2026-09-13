const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { JWT_SECRET } = require('./config/env');
const db = require('./db');

// Middleware customer auth
const requireCustomerAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'customer') return res.status(403).json({ error: 'Accès refusé' });
    req.customerId = decoded.customerId;
    req.customerEmail = decoded.email;
    next();
  } catch { res.status(403).json({ error: 'Token invalide' }); }
};

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = z.object({
      firstName: z.string().min(1), lastName: z.string().min(1),
      email: z.string().email(), password: z.string().min(6),
      phone: z.string().optional()
    }).parse(req.body);

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ error: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email, password: hash, name: `${firstName} ${lastName}`, role: 'customer' }
    });

    const customer = await db.customer.upsert({
      where: { email },
      create: { email, firstName, lastName, phone },
      update: { firstName, lastName, phone: phone || undefined }
    });

    const token = jwt.sign(
      { type: 'customer', customerId: customer.id, email, userId: user.id },
      JWT_SECRET, { expiresIn: '30d' }
    );
    res.status(201).json({ token, customer: { id: customer.id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, loyaltyPoints: customer.loyaltyPoints, totalSpent: customer.totalSpent } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Données invalides', details: err.errors });
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    if (user.role !== 'customer') return res.status(403).json({
      error: 'Ce compte n\'est pas un compte client. Connectez-vous sur /admin/login pour les comptes admin, manager et vendeur.',
      redirectTo: '/admin/login'
    });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    const customer = await db.customer.findUnique({ where: { email } });
    if (!customer) return res.status(404).json({ error: 'Compte client non trouvé' });
    const token = jwt.sign({ type: 'customer', customerId: customer.id, email, userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, customer: { id: customer.id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, loyaltyPoints: customer.loyaltyPoints, totalSpent: customer.totalSpent } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Données invalides', details: err.errors });
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

// GET /me
router.get('/me', requireCustomerAuth, async (req, res) => {
  try {
    const customer = await db.customer.findUnique({ where: { id: req.customerId }, include: { address: true } });
    if (!customer) return res.status(404).json({ error: 'Client non trouvé' });
    res.json({ customer });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /orders
router.get('/orders', requireCustomerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { customerId: req.customerId },
        include: {
          items: { include: { product: { select: { id: true, name: true, image: true, price: true } } } },
          payment: true, shipping: true
        },
        orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit)
      }),
      db.order.count({ where: { customerId: req.customerId } })
    ]);
    res.json({ orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /orders/:id
router.get('/orders/:id', requireCustomerAuth, async (req, res) => {
  try {
    const order = await db.order.findFirst({
      where: { id: req.params.id, customerId: req.customerId },
      include: {
        customer: { include: { address: true } },
        items: { include: { product: true, seller: { select: { id: true, storeName: true, slug: true } } } },
        payment: true, shipping: true
      }
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /orders/:id/return-request
router.post('/orders/:id/return-request', requireCustomerAuth, async (req, res) => {
  try {
    const order = await db.order.findFirst({
      where: { id: req.params.id, customerId: req.customerId },
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (!['DELIVERED'].includes(order.status)) {
      return res.status(400).json({ error: 'La commande doit être livrée pour demander un retour' });
    }
    const existing = await db.returnRequest.findFirst({
      where: { orderId: order.id },
    });
    if (existing) return res.status(409).json({ error: 'Une demande de retour existe déjà pour cette commande' });

    const { reason, description } = z.object({
      reason:      z.string().min(1),
      description: z.string().optional(),
    }).parse(req.body);

    const returnReq = await db.returnRequest.create({
      data: { orderId: order.id, customerId: req.customerId, reason, description },
    });
    res.status(201).json(returnReq);
  } catch (err) {
    if (err?.name === 'ZodError') return res.status(400).json({ error: 'Données invalides', details: err.errors });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /orders/:id/invoice — returns full order data for invoice rendering
router.get('/orders/:id/invoice', requireCustomerAuth, async (req, res) => {
  try {
    const order = await db.order.findFirst({
      where: { id: req.params.id, customerId: req.customerId },
      include: {
        customer: { include: { address: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, image: true, price: true } },
            seller:  { select: { id: true, storeName: true } },
          },
        },
        payment:  true,
        shipping: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /wishlist/products - récupère les détails de produits en wishlist (IDs envoyés depuis localStorage)
router.post('/wishlist/products', async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) return res.json([]);
    const products = await db.product.findMany({
      where: { id: { in: productIds.map(Number) }, status: 'active' },
      include: { category: { select: { id: true, name: true, slug: true } } }
    });
    res.json(products);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
module.exports.requireCustomerAuth = requireCustomerAuth;
