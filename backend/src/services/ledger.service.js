const db = require('../db');

class LedgerService {
  /**
   * Enregistre les écritures de vente lors de la confirmation d'un paiement (MM-BE-050)
   */
  static async recordOrderPayment(orderId, tx = db) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) return;

    // Regrouper les articles par vendeur
    const sellerItems = {};
    for (const item of order.items) {
      if (item.sellerId) {
        if (!sellerItems[item.sellerId]) {
          sellerItems[item.sellerId] = [];
        }
        sellerItems[item.sellerId].push(item);
      }
    }

    // Créer les écritures en attente pour chaque vendeur
    for (const [sellerId, items] of Object.entries(sellerItems)) {
      const totalSales = items.reduce((sum, it) => sum + it.totalPrice, 0);
      const feeAmount = items.reduce((sum, it) => sum + (it.commissionAmount || 0), 0);
      const netAmount = items.reduce((sum, it) => sum + (it.sellerEarnings || (it.totalPrice - (it.commissionAmount || 0))), 0);

      // Éviter les écritures dupliquées pour la même commande
      const existing = await tx.sellerLedgerEntry.findFirst({
        where: {
          sellerId,
          orderId: order.id,
          type: 'SALE_PENDING',
        },
      });

      if (!existing) {
        await tx.sellerLedgerEntry.create({
          data: {
            sellerId,
            orderId: order.id,
            type: 'SALE_PENDING',
            amount: totalSales,
            feeAmount,
            netAmount,
            status: 'PENDING',
            description: `Vente commande #${order.orderNumber} (en attente de livraison)`,
          },
        });
      }
    }
  }

  /**
   * Rend les fonds disponibles pour le vendeur après livraison (MM-BE-050)
   */
  static async makeOrderFundsAvailable(orderId, tx = db) {
    const pendingEntries = await tx.sellerLedgerEntry.findMany({
      where: {
        orderId,
        status: 'PENDING',
      },
      include: { order: true },
    });

    for (const entry of pendingEntries) {
      await tx.sellerLedgerEntry.update({
        where: { id: entry.id },
        data: {
          type: 'SALE_AVAILABLE',
          status: 'AVAILABLE',
          availableAt: new Date(),
          description: `Fonds libérés suite à la livraison #${entry.order?.orderNumber || orderId}`,
        },
      });
    }
  }

  /**
   * Enregistre l'annulation ou le remboursement d'une commande (MM-BE-050)
   */
  static async recordOrderRefund(orderId, { reason } = {}, tx = db) {
    const entries = await tx.sellerLedgerEntry.findMany({
      where: { orderId },
      include: { order: true },
    });

    for (const entry of entries) {
      if (entry.status === 'PENDING') {
        // Si encore en attente, annuler purement et simplement
        await tx.sellerLedgerEntry.update({
          where: { id: entry.id },
          data: {
            status: 'CANCELLED',
            description: `Vente annulée pour la commande #${entry.order?.orderNumber || orderId} (${reason || 'Remboursement'})`,
          },
        });
      } else if (entry.status === 'AVAILABLE') {
        // Si déjà disponible, créer une écriture négative de compensation
        await tx.sellerLedgerEntry.create({
          data: {
            sellerId: entry.sellerId,
            orderId,
            type: 'REFUND',
            amount: -entry.amount,
            feeAmount: -entry.feeAmount,
            netAmount: -entry.netAmount,
            status: 'CLEARED',
            description: `Remboursement commande #${entry.order?.orderNumber || orderId} (${reason || 'Retour article'})`,
          },
        });
      }
    }
  }

  /**
   * Calcule avec exactitude les 4 soldes du vendeur (MM-BE-050 / MM-FE-050)
   */
  static async getSellerBalances(sellerId) {
    // 1. Solde en attente (commandes confirmées non encore livrées)
    const pendingAgg = await db.sellerLedgerEntry.aggregate({
      where: {
        sellerId,
        status: 'PENDING',
      },
      _sum: { netAmount: true },
    });
    const pending = pendingAgg._sum.netAmount || 0;

    // 2. Total disponible brut (ventes livrées moins remboursements)
    const availableAgg = await db.sellerLedgerEntry.aggregate({
      where: {
        sellerId,
        status: { in: ['AVAILABLE', 'CLEARED'] },
      },
      _sum: { netAmount: true },
    });
    const totalEarnedCleared = availableAgg._sum.netAmount || 0;

    // 3. Montants réservés pour retraits en cours (pending, processing)
    const reservedAgg = await db.sellerPayout.aggregate({
      where: {
        sellerId,
        status: { in: ['pending', 'processing'] },
      },
      _sum: { amount: true },
    });
    const reserved = reservedAgg._sum.amount || 0;

    // 4. Montants déjà versés et complétés
    const paidAgg = await db.sellerPayout.aggregate({
      where: {
        sellerId,
        status: 'completed',
      },
      _sum: { amount: true },
    });
    const paid = paidAgg._sum.amount || 0;

    // Le solde réellement retirable
    const available = Math.max(0, totalEarnedCleared - reserved - paid);

    return {
      pending,
      available,
      reserved,
      paid,
      totalEarnings: pending + totalEarnedCleared,
      currency: 'XOF',
    };
  }

  /**
   * Demande de retrait atomique avec réservation de solde (MM-BE-051)
   */
  static async requestPayout({ sellerId, amount, method, metadata, userId, ipAddress }) {
    if (!amount || amount <= 0) {
      throw new Error('Le montant du retrait doit être supérieur à zéro');
    }

    const MIN_PAYOUT_AMOUNT = 500000; // 5 000 FCFA minimum
    if (amount < MIN_PAYOUT_AMOUNT) {
      throw new Error(`Le montant minimum de retrait est de ${MIN_PAYOUT_AMOUNT / 100} FCFA`);
    }

    return await db.$transaction(async (tx) => {
      // 1. Vérifier le solde disponible actuel
      const availableAgg = await tx.sellerLedgerEntry.aggregate({
        where: {
          sellerId,
          status: { in: ['AVAILABLE', 'CLEARED'] },
        },
        _sum: { netAmount: true },
      });
      const totalEarnedCleared = availableAgg._sum.netAmount || 0;

      const activePayouts = await tx.sellerPayout.aggregate({
        where: {
          sellerId,
          status: { in: ['pending', 'processing', 'completed'] },
        },
        _sum: { amount: true },
      });
      const totalCommitted = activePayouts._sum.amount || 0;
      const currentAvailable = totalEarnedCleared - totalCommitted;

      if (amount > currentAvailable) {
        const err = new Error(
          `Solde disponible insuffisant. Disponible : ${Math.max(0, currentAvailable) / 100} FCFA, Demandé : ${amount / 100} FCFA`
        );
        err.statusCode = 400;
        throw err;
      }

      // 2. Créer la demande de virement
      const payout = await tx.sellerPayout.create({
        data: {
          sellerId,
          amount,
          method: method || 'bank_transfer',
          status: 'pending',
          metadata: metadata || {},
        },
      });

      // 3. Réserver immédiatement le montant dans le ledger
      await tx.sellerLedgerEntry.create({
        data: {
          sellerId,
          payoutId: payout.id,
          type: 'PAYOUT_RESERVED',
          amount: -amount,
          feeAmount: 0,
          netAmount: -amount,
          status: 'LOCKED',
          description: `Retrait en attente #${payout.id.slice(0, 8).toUpperCase()}`,
        },
      });

      // 4. AuditLog
      await tx.auditLog.create({
        data: {
          userId: userId || null,
          action: 'PAYOUT_REQUESTED',
          entity: 'SellerPayout',
          entityId: payout.id,
          details: { sellerId, amount, method },
          ipAddress: ipAddress || null,
        },
      });

      return payout;
    });
  }

  /**
   * Traitement d'un versement par l'administration (MM-BE-051)
   */
  static async updatePayoutStatus(payoutId, nextStatus, { reference, reason, adminUserId, ipAddress } = {}) {
    const ALLOWED_PAYOUT_TRANSITIONS = {
      pending: ['processing', 'cancelled', 'failed'],
      processing: ['completed', 'failed'],
      completed: [],
      failed: [],
      cancelled: [],
    };

    return await db.$transaction(async (tx) => {
      const payout = await tx.sellerPayout.findUnique({
        where: { id: payoutId },
        include: { seller: true },
      });

      if (!payout) {
        const err = new Error('Demande de retrait introuvable');
        err.statusCode = 404;
        throw err;
      }

      const allowed = ALLOWED_PAYOUT_TRANSITIONS[payout.status] || [];
      if (!allowed.includes(nextStatus)) {
        const err = new Error(`Transition impossible de ${payout.status} vers ${nextStatus}`);
        err.statusCode = 409;
        throw err;
      }

      // Si complété : confirmer le retrait
      if (nextStatus === 'completed') {
        await tx.sellerLedgerEntry.updateMany({
          where: { payoutId: payout.id },
          data: {
            type: 'PAYOUT_COMPLETED',
            status: 'CLEARED',
            description: `Retrait complété (Réf: ${reference || 'N/A'})`,
          },
        });
      }

      // Si annulé ou échoué : libérer la réserve pour rendre le solde à nouveau disponible
      if (['failed', 'cancelled'].includes(nextStatus)) {
        await tx.sellerLedgerEntry.updateMany({
          where: { payoutId: payout.id },
          data: {
            type: 'PAYOUT_RELEASED',
            status: 'CANCELLED',
            description: `Retrait ${nextStatus === 'failed' ? 'échoué' : 'annulé'} - Réserve libérée (${reason || 'Raison administrative'})`,
          },
        });
      }

      const updatedPayout = await tx.sellerPayout.update({
        where: { id: payoutId },
        data: {
          status: nextStatus,
          reference: reference || payout.reference,
          paidAt: nextStatus === 'completed' ? new Date() : payout.paidAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId || null,
          action: `PAYOUT_STATUS_${nextStatus.toUpperCase()}`,
          entity: 'SellerPayout',
          entityId: payout.id,
          details: { from: payout.status, to: nextStatus, reason, reference },
          ipAddress: ipAddress || null,
        },
      });

      return updatedPayout;
    });
  }

  /**
   * Valide et finalise un versement (MM-BE-051)
   */
  static async processPayout(payoutId, opts = {}) {
    return this.updatePayoutStatus(payoutId, 'completed', opts);
  }

  /**
   * Échoue et libère la réserve d'un versement (MM-BE-051)
   */
  static async failPayout(payoutId, opts = {}) {
    return this.updatePayoutStatus(payoutId, 'failed', opts);
  }
}

module.exports = LedgerService;
