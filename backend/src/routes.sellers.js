const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { requireAuth, requireAdmin, requireSeller } = require('./middleware.auth');
const db = require('./db');

// Slugify helper
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Schémas validation
const registerSellerSchema = z.object({
  storeName: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional()
});

const updateSellerSchema = z.object({
  storeName: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  paymentInfo: z.object({
    method: z.enum(['mobile_money', 'bank_transfer', 'orange_money', 'mtn_money']),
    accountNumber: z.string(),
    accountName: z.string(),
    operator: z.string().optional()
  }).optional()
});

const approveSellerSchema = z.object({
  status: z.enum(['approved', 'suspended']),
  commissionRate: z.number().min(0).max(100).optional()
});

// ==================== ROUTES PUBLIQUES ====================

// GET liste des vendeurs (approuvés uniquement)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { status: 'approved' };
    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [sellers, total] = await Promise.all([
      db.seller.findMany({
        where,
        select: {
          id: true, storeName: true, slug: true, description: true, logo: true,
          rating: true, reviewCount: true,
          _count: { select: { products: true } }
        },
        orderBy: { totalSales: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      db.seller.count({ where })
    ]);

    res.json({
      sellers: sellers.map(s => ({
        ...s,
        productCount: s._count.products
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur GET /sellers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET profil vendeur par slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const seller = await db.seller.findFirst({
      where: { slug: req.params.slug, status: 'approved' },
      include: {
        products: {
          where: { status: 'active' },
          take: 48,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            categoryId: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
            _count: { select: { reviews: true } },
          }
        },
        _count: { select: { products: true } }
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    // Moyenne des avis par produit (requête légère)
    const productIds = seller.products.map((p) => p.id);
    let ratingByProduct = {};
    if (productIds.length > 0) {
      const grouped = await db.review.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
      });
      ratingByProduct = Object.fromEntries(
        grouped.map((g) => [g.productId, { avg: g._avg.rating || 0, count: g._count.rating || 0 }])
      );
    }

    const products = seller.products.map((p) => {
      const { _count, ...rest } = p;
      const stats = ratingByProduct[p.id] || { avg: 0, count: _count?.reviews || 0 };
      return {
        ...rest,
        rating: Math.round((stats.avg || 0) * 10) / 10,
        reviewCount: stats.count,
      };
    });

    res.json({
      ...seller,
      products,
      productCount: seller._count.products
    });
  } catch (error) {
    console.error('Erreur GET /sellers/slug/:slug:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== INSCRIPTION VENDEUR (avant /:id) ====================

// POST inscription vendeur (authentifié)
router.post('/register', requireAuth, async (req, res) => {
  try {
    const data = registerSellerSchema.parse(req.body);

    const existingSeller = await db.seller.findUnique({
      where: { userId: req.user.userId }
    });
    if (existingSeller) {
      return res.status(409).json({ error: 'Vous avez déjà un compte vendeur.' });
    }

    const slug = data.slug || slugify(data.storeName);
    const slugExists = await db.seller.findUnique({ where: { slug } });
    if (slugExists) {
      return res.status(409).json({ error: 'Ce nom de boutique est déjà pris. Choisissez un autre slug.' });
    }

    const seller = await db.seller.create({
      data: {
        userId: req.user.userId,
        storeName: data.storeName,
        slug,
        description: data.description,
        logo: data.logo,
        status: 'pending' // Attente approbation admin
      }
    });

    await db.user.update({
      where: { id: req.user.userId },
      data: { role: 'seller' }
    });

    res.status(201).json({
      seller: {
        id: seller.id,
        storeName: seller.storeName,
        slug: seller.slug,
        status: seller.status,
        message: 'Inscription envoyée. Votre compte sera activé après vérification.'
      }
    });
  } catch (error) {
    console.error('Erreur POST /sellers/register:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== DASHBOARD VENDEUR (avant /:id) ====================

// GET vérifier si l'utilisateur a un compte vendeur (même en attente)
router.get('/me/status', requireAuth, async (req, res) => {
  try {
    const seller = await db.seller.findUnique({ where: { userId: req.user.userId } });
    res.json({ hasSeller: !!seller, status: seller?.status || null });
  } catch (error) {
    console.error('Erreur GET /sellers/me/status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET mon profil vendeur
router.get('/me/profile', requireAuth, requireSeller, async (req, res) => {
  try {
    const seller = await db.seller.findUnique({
      where: { id: req.seller.id },
      include: {
        user: { select: { email: true, name: true } }
      }
    });
    res.json(seller);
  } catch (error) {
    console.error('Erreur GET /sellers/me/profile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT modifier mon profil vendeur
router.put('/me/profile', requireAuth, requireSeller, async (req, res) => {
  try {
    const data = updateSellerSchema.parse(req.body);

    if (data.storeName) {
      const slug = slugify(data.storeName);
      const slugExists = await db.seller.findFirst({
        where: { slug, id: { not: req.seller.id } }
      });
      if (slugExists) {
        return res.status(409).json({ error: 'Ce nom de boutique est déjà pris.' });
      }
    }

    const seller = await db.seller.update({
      where: { id: req.seller.id },
      data
    });
    res.json(seller);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET mes produits
router.get('/me/products', requireAuth, requireSeller, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      db.product.findMany({
        where: { sellerId: req.seller.id },
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      db.product.count({ where: { sellerId: req.seller.id } })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur GET /sellers/me/products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET mes commandes
router.get('/me/orders', requireAuth, requireSeller, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      items: { some: { sellerId: req.seller.id } }
    };
    if (status) where.status = status;

    const orders = await db.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          where: { sellerId: req.seller.id },
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await db.order.count({ where });

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur GET /sellers/me/orders:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sellers/me/balance - 4 soldes réels du vendeur (MM-BE-052 / MM-FE-050)
router.get('/me/balance', requireAuth, requireSeller, async (req, res) => {
  try {
    const LedgerService = require('./services/ledger.service');
    const balances = await LedgerService.getSellerBalances(req.seller.id);
    res.json(balances);
  } catch (error) {
    console.error('Erreur GET /sellers/me/balance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sellers/me/ledger - Registre comptable vendeur paginé (MM-BE-052)
router.get('/me/ledger', requireAuth, requireSeller, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { sellerId: req.seller.id };
    if (type) where.type = type;
    if (status) where.status = status;

    const [entries, total] = await Promise.all([
      db.sellerLedgerEntry.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, status: true } },
          payout: { select: { id: true, status: true, method: true, reference: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      db.sellerLedgerEntry.count({ where }),
    ]);

    res.json({
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur GET /sellers/me/ledger:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sellers/me/ledger/export - Export CSV comptable vendeur (MM-FE-050)
router.get('/me/ledger/export', requireAuth, requireSeller, async (req, res) => {
  try {
    const entries = await db.sellerLedgerEntry.findMany({
      where: { sellerId: req.seller.id },
      include: {
        order: { select: { orderNumber: true } },
        payout: { select: { reference: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const headers = 'Date,Type,Description,Montant_Brut_FCFA,Commission_FCFA,Net_Vendeur_FCFA,Statut,Reference\n';
    const rows = entries.map(e => {
      const date = new Date(e.createdAt).toISOString().slice(0, 10);
      const brut = (e.amount / 100).toFixed(2);
      const com = (e.feeAmount / 100).toFixed(2);
      const net = (e.netAmount / 100).toFixed(2);
      const ref = e.order?.orderNumber || e.payout?.reference || e.id.slice(0, 8);
      const desc = (e.description || '').replace(/,/g, ';');
      return `${date},${e.type},"${desc}",${brut},${com},${net},${e.status},${ref}`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ledger-mandemarket-${req.seller.slug}-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(headers + rows);
  } catch (error) {
    console.error('Erreur export CSV ledger:', error);
    res.status(500).json({ error: 'Erreur lors de l’export CSV' });
  }
});

// POST demander un versement (MM-BE-051 / MM-BE-052)
const handlePayoutRequest = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const amountNum = Math.round(Number(amount) || 0);

    const LedgerService = require('./services/ledger.service');
    const payoutMethod = method || req.seller.paymentInfo?.method || 'bank_transfer';

    const payout = await LedgerService.requestPayout({
      sellerId: req.seller.id,
      amount: amountNum,
      method: payoutMethod,
      metadata: req.seller.paymentInfo || {},
      userId: req.user.userId,
      ipAddress: req.ip,
    });

    res.status(201).json(payout);
  } catch (error) {
    console.error('Erreur demande versement:', error.message);
    res.status(error.statusCode || 400).json({ error: error.message || 'Erreur lors de la demande de versement' });
  }
};

router.post('/me/payouts', requireAuth, requireSeller, handlePayoutRequest);
router.post('/me/payouts/request', requireAuth, requireSeller, handlePayoutRequest);

// GET mes versements
router.get('/me/payouts', requireAuth, requireSeller, async (req, res) => {
  try {
    const payouts = await db.sellerPayout.findMany({
      where: { sellerId: req.seller.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(payouts);
  } catch (error) {
    console.error('Erreur GET /sellers/me/payouts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET mes revenus / statistiques avec projections du ledger
router.get('/me/earnings', requireAuth, requireSeller, async (req, res) => {
  try {
    const LedgerService = require('./services/ledger.service');
    const [balances, totalOrders] = await Promise.all([
      LedgerService.getSellerBalances(req.seller.id),
      db.orderItem.count({ where: { sellerId: req.seller.id } }),
    ]);

    res.json({
      totalSales: req.seller.totalSales,
      totalEarnings: balances.totalEarnings,
      commissionRate: req.seller.commissionRate,
      totalOrders,
      balances,
      pendingPayoutAmount: balances.reserved,
    });
  } catch (error) {
    console.error('Erreur GET /sellers/me/earnings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ADMIN (avant /:id) ====================

// GET tous les vendeurs (admin)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const sellers = await db.seller.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(sellers.map(s => ({
      ...s,
      productCount: s._count.products
    })));
  } catch (error) {
    console.error('Erreur GET /sellers/admin/all:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET tous les payouts (admin)
router.get('/admin/payouts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const payouts = await db.sellerPayout.findMany({
      where,
      include: { seller: { select: { storeName: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(payouts);
  } catch (error) {
    console.error('Erreur GET /sellers/admin/payouts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/payouts/:id/process - Validation / finalisation d'un virement (MM-BE-052)
router.post('/admin/payouts/:id/process', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reference, status = 'completed' } = req.body;
    const LedgerService = require('./services/ledger.service');

    const updated = await LedgerService.updatePayoutStatus(req.params.id, status, {
      reference,
      adminUserId: req.user.userId,
      ipAddress: req.ip,
    });

    res.json({ success: true, payout: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Erreur traitement versement' });
  }
});

// POST /api/admin/payouts/:id/fail - Rejet et libération de la réserve (MM-BE-052)
router.post('/admin/payouts/:id/fail', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const LedgerService = require('./services/ledger.service');

    const updated = await LedgerService.updatePayoutStatus(req.params.id, 'failed', {
      reason,
      adminUserId: req.user.userId,
      ipAddress: req.ip,
    });

    res.json({ success: true, payout: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Erreur rejet versement' });
  }
});

// PUT traiter un payout (admin - compatibilité)
router.put('/admin/payouts/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, reference, reason } = req.body;
    const LedgerService = require('./services/ledger.service');

    const payout = await LedgerService.updatePayoutStatus(req.params.id, status || 'completed', {
      reference,
      reason,
      adminUserId: req.user.userId,
      ipAddress: req.ip,
    });

    res.json(payout);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Erreur serveur' });
  }
});

// PUT approuver/suspendre vendeur (admin)
router.put('/admin/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = approveSellerSchema.parse(req.body);

    const { status } = data;

    const seller = await db.seller.update({
      where: { id: req.params.id },
      data: {
        status: data.status,
        ...(data.commissionRate !== undefined && { commissionRate: data.commissionRate })
      },
      include: {
        user: { select: { email: true, name: true } }
      }
    });

    // Email de notification au vendeur
    try {
      const emailService = require('./services/email.service');
      if (seller.user && (status === 'approved')) {
        emailService.sendSellerApproval(seller.user.email, seller.user.name || seller.storeName, seller.storeName).catch(console.error);
      }
    } catch (emailErr) {
      console.error('[Email] Erreur notification vendeur:', emailErr.message);
    }

    res.json(seller);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ROUTE PUBLIQUE (doit être en dernier) ====================

// GET vendeur par ID (public, infos limitées)
router.get('/:id', async (req, res) => {
  try {
    const seller = await db.seller.findFirst({
      where: { id: req.params.id, status: 'approved' },
      select: {
        id: true, storeName: true, slug: true, description: true, logo: true,
        rating: true, reviewCount: true,
        _count: { select: { products: true } }
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    res.json({
      ...seller,
      productCount: seller._count.products
    });
  } catch (error) {
    console.error('Erreur GET /sellers/:id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
