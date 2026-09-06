const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { requireAuth, requireRole } = require('./middleware.auth');
const db = require('./db');

// Schémas de validation
const orderSchema = z.object({
  customerId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  totalAmount: z.number().int().positive(),
  taxAmount: z.number().int().min(0).optional(),
  shippingCost: z.number().int().min(0).optional(),
  discountAmount: z.number().int().min(0).optional(),
  promotionCode: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().int().positive()
  }))
});

const orderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  notes: z.string().optional()
});

// Schéma de validation pour le checkout public
const checkoutSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional()
  }),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().default('00000'),
    country: z.string().default('Côte d\'Ivoire')
  }),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().int().positive()
  })).min(1),
  totalAmount: z.number().int().positive(),
  paymentMethod: z.string().default('cash_on_delivery'),
  shippingMethod: z.string().optional(),
  shippingCost: z.number().int().min(0).optional().default(0),
  region: z.enum(['africa', 'europe']).optional().default('africa'),
  notes: z.string().optional()
});

// POST checkout public (sans authentification requise)
router.post('/checkout', async (req, res) => {
  try {
    const data = checkoutSchema.parse(req.body);

    // Normaliser le paymentMethod (inclut les opérateurs Mobile Money CI)
    const payMethodMap = {
      'cash_on_delivery': 'CASH_ON_DELIVERY', 'mobile_money': 'CASH_ON_DELIVERY',
      'bank_transfer': 'BANK_TRANSFER',
      'paystack': 'CARD', 'cinetpay': 'CARD', 'stripe': 'CARD',
      'mtn_momo': 'CARD', 'orange_money': 'CARD', 'wave': 'CARD', 'moov_money': 'CARD',
    };
    const normalizedMethod = payMethodMap[data.paymentMethod] || data.paymentMethod.toUpperCase();

    // Upsert le client par email (créer ou trouver)
    let customer = await db.customer.findUnique({ where: { email: data.customer.email } });
    if (!customer) {
      customer = await db.customer.create({
        data: {
          email: data.customer.email,
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          phone: data.customer.phone,
          ...(data.address && {
            address: {
              create: {
                street: data.address.street,
                city: data.address.city,
                postalCode: data.address.postalCode || '00000',
                country: data.address.country || 'Côte d\'Ivoire',
                isDefault: true
              }
            }
          })
        }
      });
    } else if (data.address) {
      // Mettre à jour l'adresse si elle existe
      await db.address.upsert({
        where: { customerId: customer.id },
        create: { customerId: customer.id, street: data.address.street, city: data.address.city, postalCode: data.address.postalCode || '00000', country: data.address.country || 'Côte d\'Ivoire', isDefault: true },
        update: { street: data.address.street, city: data.address.city, postalCode: data.address.postalCode || '00000', country: data.address.country || 'Côte d\'Ivoire' }
      });
    }

    // Récupérer les produits et vendeurs pour calcul des commissions
    const productIds = [...new Set(data.items.map(i => i.productId))];
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: { seller: true }
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    const itemsWithCommission = await Promise.all(data.items.map(async (item) => {
      const totalPrice = item.unitPrice * item.quantity;
      const product = productMap[item.productId];
      let sellerId = null;
      let commissionAmount = 0;
      let sellerEarnings = totalPrice;

      if (product?.seller) {
        sellerId = product.seller.id;
        const rate = product.seller.commissionRate || 10;
        commissionAmount = Math.round(totalPrice * (rate / 100));
        sellerEarnings = totalPrice - commissionAmount;
      }

      return {
        productId: item.productId,
        sellerId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        commissionAmount,
        sellerEarnings
      };
    }));

    // Créer la commande avec les items
    const order = await db.order.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        totalAmount: data.totalAmount,
        notes: data.notes,
        items: {
          create: itemsWithCommission
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Créer le paiement
    await db.payment.create({
      data: {
        orderId: order.id,
        amount: data.totalAmount,
        method: normalizedMethod,
        status: 'PENDING'
      }
    });

    // Délai de livraison estimé selon la région
    const deliveryDays = data.region === 'europe' ? 7 : 3;
    const carrier = data.shippingMethod
      ? data.shippingMethod.split('(')[0].trim()
      : (data.region === 'europe' ? 'COLISSIMO' : 'LOCAL_ABIDJAN');

    await db.shipping.create({
      data: {
        orderId: order.id,
        method: 'STANDARD',
        carrier,
        status: 'PENDING',
        estimatedDelivery: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000),
      }
    });

    // Mettre à jour le total dépensé par le client
    await db.customer.update({
      where: { id: customer.id },
      data: {
        totalSpent: { increment: data.totalAmount }
      }
    });

    // Envoyer emails de confirmation (async, ne bloque pas la réponse)
    try {
      const emailService = require('./services/email.service');
      const fullCustomer = await db.customer.findUnique({ where: { id: customer.id } });
      const fullOrder = await db.order.findUnique({
        where: { id: order.id },
        include: { items: { include: { product: { select: { name: true } } } } }
      });
      emailService.sendOrderConfirmation(fullCustomer, fullOrder).catch(console.error);
      emailService.sendNewOrderNotification(fullOrder, fullCustomer).catch(console.error);
    } catch (emailErr) {
      console.error('[Email] Erreur préparation:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      orderId: order.id,
      message: 'Commande créée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du checkout:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET toutes les commandes avec pagination et filtres
router.get('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      customerId, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construire les filtres
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Construire le tri
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          customer: true,
          user: true,
          items: {
            include: {
              product: true
            }
          },
          payment: true,
          shipping: true
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      db.order.count({ where })
    ]);

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
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET commande par ID
router.get('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const order = await db.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: {
          include: {
            address: true
          }
        },
        user: true,
        items: {
          include: {
            product: true
          }
        },
        payment: true,
        shipping: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(order);
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer une nouvelle commande
router.post('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = orderSchema.parse(req.body);
    
    // Récupérer les produits et vendeurs pour calcul des commissions
    const productIds = [...new Set(data.items.map(i => i.productId))];
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: { seller: true }
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    const itemsWithCommission = await Promise.all(data.items.map(async (item) => {
      const totalPrice = item.unitPrice * item.quantity;
      const product = productMap[item.productId];
      let sellerId = null;
      let commissionAmount = 0;
      let sellerEarnings = totalPrice;

      if (product?.seller) {
        sellerId = product.seller.id;
        const rate = product.seller.commissionRate || 10;
        commissionAmount = Math.round(totalPrice * (rate / 100));
        sellerEarnings = totalPrice - commissionAmount;
      }

      return {
        productId: item.productId,
        sellerId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        commissionAmount,
        sellerEarnings
      };
    }));
    
    // Créer la commande avec les items
    const order = await db.order.create({
      data: {
        customerId: data.customerId,
        userId: data.userId || req.user?.userId,
        status: data.status || 'PENDING',
        totalAmount: data.totalAmount,
        taxAmount: data.taxAmount || 0,
        shippingCost: data.shippingCost || 0,
        discountAmount: data.discountAmount || 0,
        promotionCode: data.promotionCode,
        notes: data.notes,
        items: {
          create: itemsWithCommission
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            seller: { select: { id: true, storeName: true, slug: true } }
          }
        }
      }
    });

    // Mettre à jour l'inventaire
    for (const item of data.items) {
      try {
        await db.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: { increment: item.quantity },
            available: { decrement: item.quantity }
          }
        });
      } catch (e) {
        // Inventaire peut ne pas exister pour tous les produits
      }
    }

    // Mettre à jour les stats vendeurs (totalSales, totalEarnings)
    const sellerUpdates = {};
    for (const item of itemsWithCommission) {
      if (item.sellerId) {
        if (!sellerUpdates[item.sellerId]) {
          sellerUpdates[item.sellerId] = { sales: 0, earnings: 0 };
        }
        sellerUpdates[item.sellerId].sales += item.totalPrice;
        sellerUpdates[item.sellerId].earnings += item.sellerEarnings;
      }
    }
    for (const [sid, totals] of Object.entries(sellerUpdates)) {
      await db.seller.update({
        where: { id: sid },
        data: {
          totalSales: { increment: totals.sales },
          totalEarnings: { increment: totals.earnings }
        }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mettre à jour le statut d'une commande
router.put('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = orderUpdateSchema.parse(req.body);
    
    const order = await db.order.update({
      where: { id: req.params.id },
      data,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Email de mise à jour statut
    if (data.status && order.customer) {
      try {
        const emailService = require('./services/email.service');
        emailService.sendOrderStatusUpdate(order.customer, order, data.status).catch(console.error);
      } catch (emailErr) {
        console.error('[Email] Erreur statut:', emailErr.message);
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET statistiques des commandes
router.get('/stats/overview', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      recentOrders
    ] = await Promise.all([
      db.order.count({ where }),
      db.order.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true }
      }),
      db.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      db.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      ordersByStatus,
      recentOrders
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 