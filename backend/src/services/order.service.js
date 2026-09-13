const db = require('../db');
const PricingService = require('./pricing.service');

const ALLOWED_ORDER_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

const ALLOWED_PAYMENT_TRANSITIONS = {
  PENDING: ['PROCESSING', 'COMPLETED', 'FAILED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

const ALLOWED_SHIPPING_TRANSITIONS = {
  PENDING: ['PROCESSING', 'SHIPPED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  RETURNED: [],
};

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MM-${dateStr}-${rand}`;
}

class OrderService {
  /**
   * Création atomique et idempotente d'une commande via devis serveur
   */
  static async checkoutOrder({ customerData, addressData, items, shippingMethod, promoCode, paymentMethod, idempotencyKey, reqUser, ipAddress, notes }) {
    // 1. Contrôle d'idempotence strict (MM-BE-032)
    if (idempotencyKey) {
      const existingOrder = await db.order.findUnique({
        where: { idempotencyKey },
        include: {
          items: true,
          payment: true,
          shipping: true,
        },
      });
      if (existingOrder) {
        return {
          order: existingOrder,
          isDuplicate: true,
        };
      }
    }

    // 2. Recalcul complet et infalsifiable du devis par le PricingService
    const quote = await PricingService.calculateQuote({
      items,
      country: addressData.country || 'CI',
      shippingMethod: shippingMethod || 'STANDARD',
      promoCode,
    });

    // 3. Normalisation de la méthode de paiement
    const payMethodMap = {
      cash_on_delivery: 'CASH_ON_DELIVERY',
      bank_transfer: 'BANK_TRANSFER',
      card: 'CARD',
      stripe: 'CARD',
      cinetpay: 'CARD',
      paystack: 'CARD',
      wave: 'CARD',
      orange_money: 'CARD',
      mtn_momo: 'CARD',
      moov_money: 'CARD',
    };
    const normalizedMethod = payMethodMap[paymentMethod?.toLowerCase()] || 'CARD';

    // 4. Transaction PostgreSQL unifiée ($transaction)
    const result = await db.$transaction(async (tx) => {
      // A. Gestion sécurisée du client sans écrasement furtif (MM-BE-032)
      let customer;
      const normalizedEmail = customerData.email.toLowerCase().trim();

      if (reqUser && reqUser.userId) {
        // Utilisateur authentifié
        customer = await tx.customer.findUnique({ where: { userId: reqUser.userId } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              userId: reqUser.userId,
              email: normalizedEmail,
              firstName: customerData.firstName.trim(),
              lastName: customerData.lastName.trim(),
              phone: customerData.phone?.trim() || null,
            },
          });
        }
      } else {
        // Invité : trouver ou créer, mais sans écraser un compte existant
        customer = await tx.customer.findUnique({ where: { email: normalizedEmail } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              email: normalizedEmail,
              firstName: customerData.firstName.trim(),
              lastName: customerData.lastName.trim(),
              phone: customerData.phone?.trim() || null,
            },
          });
        }
      }

      // Gestion de l'adresse client
      const existingAddress = await tx.address.findUnique({ where: { customerId: customer.id } });
      if (!existingAddress) {
        await tx.address.create({
          data: {
            customerId: customer.id,
            street: addressData.street,
            city: addressData.city,
            postalCode: addressData.postalCode || '00000',
            country: addressData.country || 'Côte d’Ivoire',
            isDefault: true,
          },
        });
      }

      // B. Réservation atomique du stock dans Inventory (MM-BE-032)
      for (const item of quote.items) {
        const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
        if (!inv) {
          throw new Error(`Inventaire manquant pour l'article ${item.name}`);
        }
        const available = inv.quantity - inv.reserved;
        if (available < item.quantity) {
          throw new Error(`Stock indisponible pour "${item.name}". Disponible : ${available}`);
        }

        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: { increment: item.quantity },
            available: { decrement: item.quantity },
          },
        });
      }

      // C. Réservation de la promotion
      if (quote.appliedPromotion) {
        const promo = await tx.promotion.findUnique({ where: { id: quote.appliedPromotion.id } });
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
          throw new Error('La promotion vient d’atteindre sa limite d’utilisation');
        }
        await tx.promotion.update({
          where: { id: quote.appliedPromotion.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // D. Création de la commande avec snapshots immuables
      const orderNumber = generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          userId: reqUser?.userId || null,
          status: 'PENDING',
          currency: quote.currency,
          exchangeRate: quote.exchangeRate,
          subtotalAmount: quote.subtotalAmount,
          shippingCost: quote.shippingCost,
          taxAmount: quote.taxAmount,
          discountAmount: quote.discountAmount,
          totalAmount: quote.totalAmount,
          promotionCode: quote.appliedPromotion?.code || null,
          idempotencyKey: idempotencyKey || null,
          notes: notes || null,
          customerSnapshot: {
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: normalizedEmail,
            phone: customerData.phone || null,
          },
          billingAddress: addressData,
          shippingAddress: addressData,
          items: {
            create: quote.items.map((it) => ({
              productId: it.productId,
              sellerId: it.sellerId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
              commissionRate: it.commissionRate,
              commissionAmount: it.commissionAmount,
              sellerEarnings: it.sellerEarnings,
              sku: it.sku,
              productSnapshot: {
                name: it.name,
                image: it.image,
                sku: it.sku,
              },
              selectedVariant: it.selectedVariant || null,
            })),
          },
          payment: {
            create: {
              amount: quote.totalAmount,
              method: normalizedMethod,
              status: 'PENDING',
            },
          },
          shipping: {
            create: {
              method: quote.shippingOption.method || 'STANDARD',
              status: 'PENDING',
            },
          },
          ...(quote.appliedPromotion && {
            promotionRedemptions: {
              create: {
                promotionId: quote.appliedPromotion.id,
                customerId: customer.id,
                discountApplied: quote.appliedPromotion.discountAmount,
              },
            },
          }),
        },
        include: {
          items: true,
          payment: true,
          shipping: true,
        },
      });

      // E. Journal d'audit de création
      await tx.auditLog.create({
        data: {
          userId: reqUser?.userId || null,
          action: 'ORDER_CREATED',
          entity: 'Order',
          entityId: order.id,
          details: {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            itemsCount: order.items.length,
          },
          ipAddress: ipAddress || null,
        },
      });

      return order;
    });

    return {
      order: result,
      isDuplicate: false,
    };
  }

  /**
   * Transition d'état de commande selon machine d'état (MM-BE-033)
   */
  static async transitionOrderStatus(orderId, nextStatus, { userId, reason, ipAddress } = {}) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });

    if (!order) {
      throw new Error('Commande introuvable');
    }

    const currentStatus = order.status;
    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      // Transition interdite -> AuditLog + Error 409
      await db.auditLog.create({
        data: {
          userId: userId || null,
          action: 'INVALID_ORDER_TRANSITION',
          entity: 'Order',
          entityId: order.id,
          details: { currentStatus, attemptedStatus: nextStatus, reason },
          ipAddress: ipAddress || null,
        },
      });

      const err = new Error(`Transition de statut interdite de ${currentStatus} vers ${nextStatus}`);
      err.statusCode = 409;
      throw err;
    }

    return await db.$transaction(async (tx) => {
      // Si la commande est annulée, libérer le stock réservé et la promotion (MM-BE-034)
      if (nextStatus === 'CANCELLED' && ['PENDING', 'CONFIRMED'].includes(currentStatus)) {
        for (const item of order.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              reserved: { decrement: item.quantity },
              available: { increment: item.quantity },
            },
          });
        }

        if (order.promotionCode) {
          const promo = await tx.promotion.findUnique({ where: { code: order.promotionCode } });
          if (promo) {
            await tx.promotion.update({
              where: { id: promo.id },
              data: { usedCount: { decrement: 1 } },
            });
          }
        }

        // Mettre à jour le paiement si encore PENDING
        if (order.payment && order.payment.status === 'PENDING') {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: 'FAILED' },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        include: { items: true, payment: true, shipping: true },
      });

      // Synchronisation du registre comptable vendeur (MM-BE-050)
      const LedgerService = require('./ledger.service');
      if (nextStatus === 'DELIVERED') {
        await LedgerService.makeOrderFundsAvailable(orderId, tx);
      } else if (nextStatus === 'REFUNDED') {
        await LedgerService.recordOrderRefund(orderId, { reason }, tx);
      }

      await tx.auditLog.create({
        data: {
          userId: userId || null,
          action: `ORDER_STATUS_${nextStatus}`,
          entity: 'Order',
          entityId: order.id,
          details: { from: currentStatus, to: nextStatus, reason },
          ipAddress: ipAddress || null,
        },
      });

      return updated;
    });
  }

  /**
   * Expiration automatique des commandes en attente (MM-BE-034)
   */
  static async expirePendingOrders(maxAgeMinutes = 60) {
    const cutoffDate = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const expiredOrders = await db.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoffDate },
      },
      select: { id: true, orderNumber: true },
    });

    let expiredCount = 0;
    for (const order of expiredOrders) {
      try {
        await this.transitionOrderStatus(order.id, 'CANCELLED', {
          reason: 'Expiration automatique après délai de non-paiement',
        });
        expiredCount++;
      } catch (err) {
        console.error(`Erreur expiration commande ${order.orderNumber}:`, err.message);
      }
    }

    return { expiredCount, totalFound: expiredOrders.length };
  }
}

module.exports = {
  OrderService,
  ALLOWED_ORDER_TRANSITIONS,
  ALLOWED_PAYMENT_TRANSITIONS,
  ALLOWED_SHIPPING_TRANSITIONS,
};
