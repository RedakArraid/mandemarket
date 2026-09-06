const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { requireAuth, requireRole } = require('./middleware.auth');
const db = require('./db');

// Schémas de validation
const promotionSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(1),
  description: z.string(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().positive(),
  minAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true)
});

const promotionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().positive().optional(),
  minAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional()
});

// GET toutes les promotions avec pagination
router.get('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construire les filtres
    const where = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (type) where.type = type;

    // Construire le tri
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [promotions, total] = await Promise.all([
      db.promotion.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      db.promotion.count({ where })
    ]);

    res.json({
      promotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET promotion par ID
router.get('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const promotion = await db.promotion.findUnique({
      where: { id: req.params.id }
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }

    res.json(promotion);
  } catch (error) {
    console.error('Erreur lors de la récupération de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer une nouvelle promotion
router.post('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = promotionSchema.parse(req.body);
    
    // Vérifier que le code est unique
    const existingPromotion = await db.promotion.findUnique({
      where: { code: data.code }
    });

    if (existingPromotion) {
      return res.status(409).json({ error: 'Un code promotion avec ce nom existe déjà' });
    }

    const promotion = await db.promotion.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        type: data.type,
        value: data.value,
        minAmount: data.minAmount,
        maxUses: data.maxUses,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive
      }
    });

    res.status(201).json(promotion);
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mettre à jour une promotion
router.put('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = promotionUpdateSchema.parse(req.body);
    
    const updateData = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const promotion = await db.promotion.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(promotion);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la promotion:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE supprimer une promotion
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await db.promotion.delete({
      where: { id: req.params.id }
    });

    res.status(204).end();
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST valider un code promotion
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({ error: 'Code et montant de commande requis' });
    }

    const promotion = await db.promotion.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Code promotion invalide' });
    }

    // Vérifier si la promotion est active
    if (!promotion.isActive) {
      return res.status(400).json({ error: 'Cette promotion n\'est plus active' });
    }

    // Vérifier les dates
    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      return res.status(400).json({ error: 'Cette promotion n\'est pas valide à cette date' });
    }

    // Vérifier le montant minimum
    if (promotion.minAmount && orderAmount < promotion.minAmount) {
      return res.status(400).json({ 
        error: `Montant minimum requis: ${promotion.minAmount / 100} FCFA` 
      });
    }

    // Vérifier le nombre d'utilisations
    if (promotion.maxUses && promotion.usedCount >= promotion.maxUses) {
      return res.status(400).json({ error: 'Cette promotion a atteint sa limite d\'utilisation' });
    }

    // Calculer la réduction
    let discountAmount = 0;
    switch (promotion.type) {
      case 'PERCENTAGE':
        discountAmount = (orderAmount * promotion.value) / 100;
        break;
      case 'FIXED_AMOUNT':
        discountAmount = promotion.value;
        break;
      case 'FREE_SHIPPING':
        discountAmount = 0; // Géré séparément
        break;
    }

    res.json({
      promotion,
      discountAmount: Math.min(discountAmount, orderAmount),
      isValid: true
    });
  } catch (error) {
    console.error('Erreur lors de la validation du code promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET statistiques des promotions
router.get('/analytics/overview', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      totalPromotions,
      activePromotions,
      totalUses,
      totalDiscount,
      promotionsByType
    ] = await Promise.all([
      // Total des promotions
      db.promotion.count({ where }),
      // Promotions actives
      db.promotion.count({
        where: { ...where, isActive: true }
      }),
      // Total des utilisations
      db.promotion.aggregate({
        where,
        _sum: { usedCount: true }
      }),
      // Total des réductions (approximatif)
      db.order.aggregate({
        where: {
          ...where,
          promotionCode: { not: null },
          status: { not: 'CANCELLED' }
        },
        _sum: { discountAmount: true }
      }),
      // Promotions par type
      db.promotion.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { usedCount: true }
      })
    ]);

    res.json({
      totalPromotions,
      activePromotions,
      totalUses: totalUses._sum.usedCount || 0,
      totalDiscount: totalDiscount._sum.discountAmount || 0,
      promotionsByType
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET promotions expirant bientôt
router.get('/analytics/expiring', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + parseInt(days));

    const expiringPromotions = await db.promotion.findMany({
      where: {
        endDate: { lte: threshold },
        isActive: true
      },
      orderBy: { endDate: 'asc' }
    });

    res.json({
      expiringPromotions,
      days: parseInt(days)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions expirantes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 