const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('./middleware.auth');
const db = require('./db');

// GET vue d'ensemble du tableau de bord
router.get('/overview', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { period = '30' } = req.query; // jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      // Statistiques de ventes
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowth,
      
      // Statistiques des produits
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      
      // Statistiques des clients
      totalCustomers,
      newCustomers,
      activeCustomers,
      
      // Commandes par statut
      ordersByStatus,
      
      // Top produits
      topProducts,
      
      // Alertes
      stockAlerts,
      recentOrders,
      
      // Graphiques
      revenueByDay,
      ordersByDay,
      topCategories
    ] = await Promise.all([
      // CA total
      db.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      
      // Nombre de commandes
      db.order.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Valeur moyenne des commandes
      db.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate }
        },
        _avg: { totalAmount: true }
      }),
      
      // Croissance du CA (comparaison avec la période précédente)
      db.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: {
            gte: new Date(startDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000),
            lt: startDate
          }
        },
        _sum: { totalAmount: true }
      }),
      
      // Total produits
      db.product.count(),
      
      // Produits en stock faible
      db.product.count({
        where: {
          stock: {
            lte: 10,
            gt: 0
          }
        }
      }),
      
      // Produits en rupture
      db.product.count({
        where: { stock: 0 }
      }),
      
      // Total clients
      db.customer.count(),
      
      // Nouveaux clients
      db.customer.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Clients actifs (avec commande dans la période)
      db.customer.count({
        where: {
          orders: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      
      // Commandes par statut
      db.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true }
      }),
      
      // Top produits vendus
      db.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
          }
        },
        _sum: { quantity: true },
        orderBy: {
          _sum: { quantity: 'desc' }
        },
        take: 5
      }),
      
      // Alertes de stock
      db.product.findMany({
        where: {
          OR: [
            { stock: 0 },
            { stock: { lte: 10 } }
          ]
        },
        include: { category: true },
        orderBy: { stock: 'asc' },
        take: 10
      }),
      
      // Commandes récentes
      db.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          customer: true,
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // CA par jour (pour graphique)
      db.order.groupBy({
        by: ['createdAt'],
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Commandes par jour (pour graphique)
      db.order.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Top catégories
      db.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
          }
        },
        _sum: { quantity: true }
      })
    ]);

    // Calculer la croissance du CA
    const currentRevenue = totalRevenue._sum.totalAmount || 0;
    const previousRevenue = revenueGrowth._sum.totalAmount || 0;
    const revenueGrowthPercent = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Analyser les top produits
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          include: { category: true }
        });
        return {
          ...product,
          totalSold: item._sum.quantity
        };
      })
    );

    // Analyser les top catégories
    const categoryAnalysis = await Promise.all(
      topCategories.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          include: { category: true }
        });
        return {
          category: product?.category?.name || 'Autre',
          quantity: item._sum.quantity
        };
      })
    );

    // Grouper par catégorie
    const topCategoriesGrouped = categoryAnalysis.reduce((acc, item) => {
      if (!item.category) return acc;
      const existing = acc.find(cat => cat.category === item.category);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push(item);
      }
      return acc;
    }, []).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Calculer les revenues par catégorie et les pourcentages
    const totalRevenueForCategories = currentRevenue || 1;
    const categoriesWithRevenue = await Promise.all(
      topCategoriesGrouped.map(async (cat) => {
        // Calculer le revenu pour cette catégorie
        const categoryProducts = await db.product.findMany({
          where: {
            category: {
              name: cat.category
            }
          },
          select: { id: true }
        });
        
        const productIds = categoryProducts.map(p => p.id);
        
        const categoryRevenue = await db.orderItem.aggregate({
          where: {
            productId: { in: productIds },
            order: {
              createdAt: { gte: startDate },
              status: { not: 'CANCELLED' }
            }
          },
          _sum: { totalPrice: true }
        });
        
        const revenue = categoryRevenue._sum.totalPrice || 0;
        const percentage = Math.round((revenue / totalRevenueForCategories) * 100);
        
        return {
          category: cat.category,
          revenue,
          percentage,
          quantity: cat.quantity
        };
      })
    );

    // Calculer la valeur du stock
    const stockValue = await db.product.aggregate({
      _sum: {
        stock: true
      }
    });
    
    const productsWithPrices = await db.product.findMany({
      select: { stock: true, price: true }
    });
    
    const totalStockValue = productsWithPrices.reduce((sum, p) => sum + (p.stock * p.price), 0);

    // Formater les données journalières pour les graphiques
    const dailyRevenueData = [];
    const dailyOrdersData = [];
    
    // Créer un map pour regrouper par jour
    const dayMap = new Map();
    
    revenueByDay.forEach(item => {
      const day = new Date(item.createdAt).toISOString().split('T')[0];
      const existing = dayMap.get(day) || { revenue: 0, orders: 0 };
      existing.revenue += item._sum.totalAmount || 0;
      dayMap.set(day, existing);
    });
    
    ordersByDay.forEach(item => {
      const day = new Date(item.createdAt).toISOString().split('T')[0];
      const existing = dayMap.get(day) || { revenue: 0, orders: 0 };
      existing.orders += item._count.id || 0;
      dayMap.set(day, existing);
    });
    
    // Convertir le map en array pour les graphiques
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      const data = dayMap.get(dayKey) || { revenue: 0, orders: 0 };
      last7Days.push({
        date: dayKey,
        revenue: data.revenue,
        orders: data.orders
      });
    }

    res.json({
      // Statistiques principales
      sales: {
        totalRevenue: currentRevenue,
        totalOrders,
        averageOrderValue: averageOrderValue._avg.totalAmount || 0,
        revenueGrowth: revenueGrowthPercent,
        period: `${period} jours`,
        dailyRevenue: last7Days,
        monthlyRevenue: last7Days, // Pour l'instant même data, à améliorer pour les mois
        topProducts: topProductsWithDetails.map(p => ({
          id: p.id,
          name: p.name,
          revenue: p.price * p.totalSold,
          units: p.totalSold
        })),
        revenueByCategory: categoriesWithRevenue
      },
      
      // Inventaire
      inventory: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        stockHealth: totalProducts > 0 ? Math.round(((totalProducts - outOfStockProducts) / totalProducts) * 100) : 0,
        stockValue: totalStockValue
      },
      
      // Clients
      customers: {
        total: totalCustomers,
        new: newCustomers,
        newThisMonth: newCustomers,
        active: activeCustomers,
        retentionRate: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0,
        customerGrowth: totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0
      },
      
      // Commandes
      orders: {
        byStatus: ordersByStatus,
        recent: recentOrders
      },
      
      // Top produits (format compatible frontend)
      topProducts: topProductsWithDetails.map(p => ({
        id: p.id,
        name: p.name,
        revenue: p.price * p.totalSold,
        units: p.totalSold
      })),
      
      // Alertes
      alerts: {
        stock: stockAlerts,
        count: stockAlerts.length
      },
      
      // Graphiques (format compatible frontend)
      charts: {
        dailyRevenue: last7Days,
        ordersByDay: last7Days,
        topCategories: topCategoriesGrouped,
        revenueByCategory: categoriesWithRevenue
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du tableau de bord:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET alertes automatisées
router.get('/alerts', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const [
      stockAlerts,
      orderAlerts,
      customerAlerts,
      promotionAlerts
    ] = await Promise.all([
      // Alertes de stock
      db.product.findMany({
        where: {
          OR: [
            { stock: 0 },
            { stock: { lte: 10 } }
          ]
        },
        include: { category: true },
        orderBy: { stock: 'asc' }
      }),
      
      // Commandes en attente depuis longtemps
      db.order.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Plus de 24h
        },
        include: { customer: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Clients inactifs
      db.customer.findMany({
        where: {
          orders: {
            none: {
              createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 jours
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: 10
      }),
      
      // Promotions expirant bientôt
      db.promotion.findMany({
        where: {
          endDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 jours
          isActive: true
        },
        orderBy: { endDate: 'asc' }
      })
    ]);

    res.json({
      stock: {
        items: stockAlerts,
        count: stockAlerts.length,
        critical: stockAlerts.filter(p => p.stock === 0).length
      },
      orders: {
        items: orderAlerts,
        count: orderAlerts.length
      },
      customers: {
        items: customerAlerts,
        count: customerAlerts.length
      },
      promotions: {
        items: promotionAlerts,
        count: promotionAlerts.length
      },
      total: stockAlerts.length + orderAlerts.length + customerAlerts.length + promotionAlerts.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET statistiques détaillées par période
router.get('/stats/detailed', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      revenueStats,
      orderStats,
      customerStats,
      productStats
    ] = await Promise.all([
      // Statistiques de revenus
      db.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: start, lte: end }
        },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _count: { id: true }
      }),
      
      // Statistiques des commandes
      db.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      
      // Statistiques des clients
      db.customer.aggregate({
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true }
      }),
      
      // Statistiques des produits
      db.product.aggregate({
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true }
      })
    ]);

    res.json({
      period: { start, end },
      revenue: {
        total: revenueStats._sum.totalAmount || 0,
        average: revenueStats._avg.totalAmount || 0,
        orders: revenueStats._count.id
      },
      orders: orderStats,
      customers: {
        new: customerStats._count.id
      },
      products: {
        new: productStats._count.id
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques détaillées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 