const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { requireAuth, requireRole } = require('./middleware.auth');
const db = require('./db');

// Schémas de validation
const customerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
    isDefault: z.boolean().default(true)
  }).optional()
});

const customerUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// GET tous les clients avec pagination et filtres
router.get('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construire les filtres
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Construire le tri
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: {
          address: true,
          orders: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      db.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET client par ID avec historique complet
router.get('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const customer = await db.customer.findUnique({
      where: { id: req.params.id },
      include: {
        address: true,
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            },
            payment: true,
            shipping: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer un nouveau client
router.post('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);
    
    const customer = await db.customer.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address ? {
          create: data.address
        } : undefined
      },
      include: {
        address: true
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Un client avec cet email existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mettre à jour un client
router.put('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = customerUpdateSchema.parse(req.body);
    
    const customer = await db.customer.update({
      where: { id: req.params.id },
      data,
      include: {
        address: true,
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    res.json(customer);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET analyse du comportement d'achat
router.get('/:id/analytics', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const customerId = req.params.id;
    const { period = '30' } = req.query; // jours

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalOrders,
      totalSpent,
      averageOrderValue,
      favoriteCategories,
      recentActivity,
      orderFrequency
    ] = await Promise.all([
      // Total des commandes
      db.order.count({
        where: {
          customerId,
          createdAt: { gte: startDate }
        }
      }),
      // Total dépensé
      db.order.aggregate({
        where: {
          customerId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      // Valeur moyenne des commandes
      db.order.aggregate({
        where: {
          customerId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate }
        },
        _avg: { totalAmount: true }
      }),
      // Catégories préférées
      db.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            customerId,
            createdAt: { gte: startDate }
          }
        },
        _sum: { quantity: true },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),
      // Activité récente
      db.order.findMany({
        where: {
          customerId,
          createdAt: { gte: startDate }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      // Fréquence des commandes
      db.order.groupBy({
        by: ['status'],
        where: {
          customerId,
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      })
    ]);

    // Analyser les catégories préférées
    const categoryAnalysis = await Promise.all(
      favoriteCategories.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          include: { category: true }
        });
        return {
          category: product.category.name,
          quantity: item._sum.quantity
        };
      })
    );

    res.json({
      totalOrders,
      totalSpent: totalSpent._sum.totalAmount || 0,
      averageOrderValue: averageOrderValue._avg.totalAmount || 0,
      favoriteCategories: categoryAnalysis,
      recentActivity,
      orderFrequency,
      period: `${period} jours`
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET segmentation des clients
router.get('/analytics/segmentation', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const [
      totalCustomers,
      highValueCustomers,
      newCustomers,
      inactiveCustomers,
      loyalCustomers
    ] = await Promise.all([
      // Total clients
      db.customer.count(),
      // Clients à haute valeur (>650,000 FCFA dépensés)
      db.customer.count({
        where: { totalSpent: { gt: 1000 } }
      }),
      // Nouveaux clients (derniers 30 jours)
      db.customer.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Clients inactifs (pas de commande depuis 90 jours)
      db.customer.count({
        where: {
          orders: {
            none: {
              createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      }),
      // Clients fidèles (plus de 5 commandes)
      db.customer.count({
        where: {
          orders: {
            _count: { gt: 5 }
          }
        }
      })
    ]);

    res.json({
      totalCustomers,
      highValueCustomers,
      newCustomers,
      inactiveCustomers,
      loyalCustomers,
      segments: {
        highValue: Math.round((highValueCustomers / totalCustomers) * 100),
        new: Math.round((newCustomers / totalCustomers) * 100),
        inactive: Math.round((inactiveCustomers / totalCustomers) * 100),
        loyal: Math.round((loyalCustomers / totalCustomers) * 100)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la segmentation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 