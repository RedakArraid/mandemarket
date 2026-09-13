const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db');
const { requireAuth, requireRole } = require('./middleware.auth');
const ledgerService = require('./services/ledger.service');

// Middleware strict : Seuls admin et manager ont accès à /api/admin
router.use(requireAuth, requireRole(['admin', 'manager']));

// ==========================================
// MM-BE-070 : GESTION DES UTILISATEURS
// ==========================================

// GET /api/admin/users - Lister, rechercher et paginer
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (role && ['user', 'customer', 'seller', 'manager', 'admin'].includes(role)) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          seller: { select: { id: true, storeName: true, slug: true, status: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          _count: {
            select: {
              orders: true,
              sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      db.user.count({ where }),
    ]);

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || (u.customer ? `${u.customer.firstName} ${u.customer.lastName}` : (u.seller ? u.seller.storeName : 'Utilisateur')),
      role: u.role,
      createdAt: u.createdAt,
      seller: u.seller,
      customer: u.customer,
      activeSessions: u._count.sessions,
      totalOrders: u._count.orders,
      isSuspended: u.role === 'user' && u.name?.includes('[SUSPENDU]'),
    }));

    res.json({
      users: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/admin/users:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des utilisateurs' });
  }
});

// POST /api/admin/users - Créer un utilisateur privilégié
router.post('/users', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, mot de passe et rôle requis' });
    }

    // Seul un admin peut créer un autre admin ou manager
    if (['admin', 'manager'].includes(role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Seul un administrateur peut créer des comptes de gestion' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        email: cleanEmail,
        name: name ? name.trim() : null,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ADMIN_USER_CREATED',
        entity: 'User',
        entityId: user.id,
        details: { email: user.email, role: user.role, createdBy: req.user.userId },
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Erreur POST /api/admin/users:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l’utilisateur' });
  }
});

// PUT /api/admin/users/:id/role - Modifier le rôle d'un utilisateur
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'customer', 'seller', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    // Seul un admin peut modifier le rôle vers ou depuis admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action réservée aux administrateurs' });
    }

    const targetUser = await db.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Empêcher de rétrograder le dernier admin
    if (targetUser.role === 'admin' && role !== 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Impossible de rétrograder le seul administrateur actif' });
      }
    }

    const updated = await db.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    await db.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ADMIN_USER_ROLE_UPDATED',
        entity: 'User',
        entityId: updated.id,
        details: { previousRole: targetUser.role, newRole: role },
      },
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Erreur rôle utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle' });
  }
});

// POST /api/admin/users/:id/revoke-sessions - Révoquer toutes les sessions actives
router.post('/users/:id/revoke-sessions', async (req, res) => {
  try {
    await db.session.updateMany({
      where: { userId: req.params.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ADMIN_USER_SESSIONS_REVOKED',
        entity: 'User',
        entityId: req.params.id,
        details: { revokedBy: req.user.userId },
      },
    });

    res.json({ success: true, message: 'Sessions révoquées avec succès' });
  } catch (error) {
    console.error('Erreur révocation sessions:', error);
    res.status(500).json({ error: 'Erreur lors de la révocation des sessions' });
  }
});

// GET /api/admin/users/:id/audit - Historique d'audit d'un utilisateur
router.get('/users/:id/audit', async (req, res) => {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        OR: [
          { userId: req.params.id },
          { entityId: req.params.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des logs d’audit' });
  }
});

// GET /api/admin/audit-logs - Journal d'audit global système
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, entity, action } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      db.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/admin/audit-logs:', error);
    res.status(500).json({ error: 'Erreur récupération journal d’audit' });
  }
});

// ==========================================
// MM-BE-071 : MODÉRATION DES AVIS CLIENTS
// ==========================================

// GET /api/admin/reviews - Tous les avis pour modération
router.get('/reviews', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const where = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              seller: { select: { id: true, storeName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      db.review.count({ where }),
    ]);

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/admin/reviews:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des avis' });
  }
});

// PUT /api/admin/reviews/:id/moderate - Approuver ou rejeter un avis
router.put('/reviews/:id/moderate', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Statut de modération invalide' });
    }

    const review = await db.review.findUnique({
      where: { id: req.params.id },
      include: { product: true },
    });

    if (!review) {
      return res.status(404).json({ error: 'Avis introuvable' });
    }

    const updated = await db.review.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Recalculer la note moyenne du produit et du vendeur si l'avis est approuvé ou retiré
    const approvedProductReviews = await db.review.findMany({
      where: { productId: review.productId, status: 'approved' },
      select: { rating: true },
    });

    if (review.product.sellerId) {
      const sellerReviews = await db.review.findMany({
        where: { product: { sellerId: review.product.sellerId }, status: 'approved' },
        select: { rating: true },
      });
      const avgSeller = sellerReviews.length > 0
        ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
        : 0;

      await db.seller.update({
        where: { id: review.product.sellerId },
        data: {
          rating: parseFloat(avgSeller.toFixed(2)),
          reviewCount: sellerReviews.length,
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ADMIN_REVIEW_MODERATED',
        entity: 'Review',
        entityId: review.id,
        details: { previousStatus: review.status, newStatus: status },
      },
    });

    res.json({ success: true, review: updated });
  } catch (error) {
    console.error('Erreur modération avis:', error);
    res.status(500).json({ error: 'Erreur lors de la modération' });
  }
});

// ==========================================
// MM-BE-072 : RETOURS ET REMBOURSEMENTS
// ==========================================

// GET /api/admin/returns - Liste des demandes de retour
router.get('/returns', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const where = {};
    if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      where.status = status;
    }

    const [returns, total] = await Promise.all([
      db.returnRequest.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
          order: {
            include: {
              items: {
                include: {
                  product: { select: { id: true, name: true, sku: true, stock: true } },
                  seller: { select: { id: true, storeName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      db.returnRequest.count({ where }),
    ]);

    res.json({
      returns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/admin/returns:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des retours' });
  }
});

// POST /api/admin/returns/:id/approve - Approuver un retour
router.post('/returns/:id/approve', async (req, res) => {
  try {
    const ret = await db.returnRequest.findUnique({ where: { id: req.params.id } });
    if (!ret) return res.status(404).json({ error: 'Demande de retour introuvable' });

    const updated = await db.returnRequest.update({
      where: { id: req.params.id },
      data: { status: 'approved' },
    });

    await db.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ADMIN_RETURN_APPROVED',
        entity: 'ReturnRequest',
        entityId: ret.id,
      },
    });

    res.json({ success: true, returnRequest: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l’approbation du retour' });
  }
});

// POST /api/admin/returns/:id/reject - Rejeter un retour
router.post('/returns/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await db.returnRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        description: reason ? `[Motif de refus]: ${reason}` : undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ADMIN_RETURN_REJECTED',
        entity: 'ReturnRequest',
        entityId: req.params.id,
        details: { reason },
      },
    });

    res.json({ success: true, returnRequest: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du rejet du retour' });
  }
});

// POST /api/admin/returns/:id/process-refund - Exécuter le remboursement et rétablir le stock
router.post('/returns/:id/process-refund', async (req, res) => {
  try {
    const ret = await db.returnRequest.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!ret) return res.status(404).json({ error: 'Demande introuvable' });
    if (ret.status === 'completed') {
      return res.status(400).json({ error: 'Ce retour a déjà été remboursé' });
    }

    await db.$transaction(async (tx) => {
      // 1. Mettre à jour le statut du retour
      await tx.returnRequest.update({
        where: { id: ret.id },
        data: { status: 'completed' },
      });

      // 2. Mettre à jour la commande
      await tx.order.update({
        where: { id: ret.orderId },
        data: { status: 'REFUNDED' },
      });

      // 3. Rétablir le stock des articles retournés
      for (const item of ret.order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            quantity: { increment: item.quantity },
            available: { increment: item.quantity },
          },
        });
      }

      // 4. Inverser les écritures de gains dans le ledger vendeur
      await ledgerService.recordRefund(ret.orderId, ret.order.totalAmount, `Retour accepté #${ret.id}`);

      // 5. Journal d'audit
      await tx.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'ADMIN_RETURN_REFUNDED',
          entity: 'ReturnRequest',
          entityId: ret.id,
          details: { orderId: ret.orderId, amount: ret.order.totalAmount },
        },
      });
    });

    res.json({ success: true, message: 'Retour remboursé et stock rétabli avec succès' });
  } catch (error) {
    console.error('Erreur remboursement retour:', error);
    res.status(500).json({ error: 'Erreur lors du remboursement' });
  }
});

module.exports = router;
