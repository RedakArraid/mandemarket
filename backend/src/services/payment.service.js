const db = require('../db');
const { OrderService } = require('./order.service');
const { xofCentimesToEurCents } = require('../utils/region');
const paystackService = require('./paystack.service');
const stripeService = require('./stripe.service');
const cinetpayService = require('./cinetpay.service');

class PaymentService {
  /**
   * Initialise un paiement auprès de la passerelle appropriée (MM-BE-040)
   */
  static async initializePayment({ orderId, gateway, returnBaseUrl, operatorGateway }) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { address: true } },
        payment: true,
        items: true,
      },
    });

    if (!order) {
      const err = new Error('Commande introuvable');
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== 'PENDING') {
      const err = new Error(`La commande ${order.orderNumber} ne peut plus être payée (statut: ${order.status})`);
      err.statusCode = 409;
      throw err;
    }

    const BASE_URL = returnBaseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const API_BASE = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
    const successUrl = `${BASE_URL}/checkout/success?orderId=${orderId}`;
    const cancelUrl = `${BASE_URL}/checkout/cancel?orderId=${orderId}`;

    // Normalisation de la passerelle selon la région
    const isEurope = order.currency === 'EUR' || order.customer?.address?.country === 'FR' || ['FR', 'BE', 'DE', 'IT', 'ES'].includes(order.customer?.address?.country);
    let effectiveGateway = gateway?.toLowerCase();

    const CI_MOBILE_OPERATORS = new Set(['mtn_momo', 'orange_money', 'wave', 'moov_money']);
    let operatorSlug = null;
    if (CI_MOBILE_OPERATORS.has(effectiveGateway)) {
      operatorSlug = effectiveGateway;
      effectiveGateway = 'paystack';
    }

    if (!effectiveGateway) {
      effectiveGateway = isEurope ? 'stripe' : 'paystack';
    }

    // Protection cohérence région
    if (isEurope) {
      effectiveGateway = 'stripe';
    }

    let result;

    if (effectiveGateway === 'paystack') {
      if (!paystackService.isConfigured()) {
        // Fallback sécurisé vers CinetPay
        const notifyUrl = `${API_BASE}/api/payment/notify/cinetpay`;
        result = await cinetpayService.initiatePayment({
          orderId,
          amount: order.totalAmount,
          customer: order.customer,
          returnUrl: successUrl,
          notifyUrl,
        });
        effectiveGateway = 'cinetpay';
      } else {
        result = await paystackService.initializeTransaction({
          orderId,
          amount: order.totalAmount,
          email: order.customer.email,
          callbackUrl: successUrl,
          mobilePhone: order.customer.phone,
          operatorGateway: operatorSlug || operatorGateway,
        });
      }
    } else if (effectiveGateway === 'stripe') {
      const currency = isEurope ? 'eur' : 'xof';
      result = await stripeService.createCheckoutSession({
        orderId,
        amount: order.totalAmount,
        customer: order.customer,
        successUrl,
        cancelUrl,
        currency,
      });
    } else if (effectiveGateway === 'cinetpay') {
      const notifyUrl = `${API_BASE}/api/payment/notify/cinetpay`;
      result = await cinetpayService.initiatePayment({
        orderId,
        amount: order.totalAmount,
        customer: order.customer,
        returnUrl: successUrl,
        notifyUrl,
      });
    } else {
      const err = new Error(`Passerelle de paiement non supportée: ${effectiveGateway}`);
      err.statusCode = 400;
      throw err;
    }

    const transactionRef = result.sessionId || result.reference || result.transactionId || orderId;

    // Mise à jour de la transaction dans Payment
    await db.payment.updateMany({
      where: { orderId },
      data: {
        gateway: effectiveGateway,
        transactionId: transactionRef,
        status: 'PROCESSING',
      },
    });

    return {
      paymentUrl: result.paymentUrl,
      gateway: effectiveGateway,
      transactionId: transactionRef,
    };
  }

  /**
   * Traitement unifié, atomique et idempotent d'un paiement réussi (MM-BE-040)
   */
  static async processPaymentSuccess({ orderId, gateway, transactionId, amountPaid, currency, rawPayload, eventId }) {
    const idempotencyKey = `${gateway}_${transactionId || orderId}_${eventId || 'success'}`;

    // 1. Contrôle d'idempotence strict (MM-BE-040)
    const existingEvent = await db.paymentEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Événement de paiement déjà traité avec succès',
      };
    }

    // 2. Charger la commande avec ses relations
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        payment: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new Error(`Commande ${orderId} introuvable pour confirmation de paiement`);
    }

    // 3. Validation stricte du montant et de la devise
    if (amountPaid !== undefined && amountPaid !== null) {
      let isAmountValid = false;

      if (gateway === 'stripe' && (currency?.toLowerCase() === 'eur' || order.currency === 'EUR')) {
        const expectedEurCents = xofCentimesToEurCents(order.totalAmount);
        // Tolérance de 2 centimes d'euro pour d'éventuels arrondis de parité
        isAmountValid = Math.abs(amountPaid - expectedEurCents) <= 2;
      } else if (gateway === 'cinetpay') {
        // CinetPay renvoie en FCFA entiers ou en centimes
        const expectedFcfa = Math.round(order.totalAmount / 100);
        isAmountValid = amountPaid === expectedFcfa || amountPaid === order.totalAmount;
      } else {
        // Paystack et standards XOF en centimes
        isAmountValid = amountPaid === order.totalAmount;
      }

      if (!isAmountValid) {
        // Enregistrer l'anomalie de sécurité
        await db.paymentEvent.upsert({
          where: { idempotencyKey },
          create: {
            orderId: order.id,
            gateway,
            eventType: 'AMOUNT_MISMATCH_SUSPECT',
            idempotencyKey,
            payload: rawPayload || {},
            status: 'FAILED',
            errorMessage: `Montant reçu (${amountPaid}) différent du total attendu (${order.totalAmount})`,
          },
          update: {
            status: 'FAILED',
            errorMessage: `Montant reçu (${amountPaid}) différent du total attendu (${order.totalAmount})`,
          },
        });

        await db.auditLog.create({
          data: {
            action: 'PAYMENT_AMOUNT_MISMATCH',
            entity: 'Order',
            entityId: order.id,
            details: { expected: order.totalAmount, received: amountPaid, gateway, currency },
          },
        });

        throw new Error(`Écart de montant détecté: attendu ${order.totalAmount}, reçu ${amountPaid}`);
      }
    }

    // 4. Exécution atomique ($transaction)
    return await db.$transaction(async (tx) => {
      // Transition de la commande vers CONFIRMED via la machine d'état
      let updatedOrder = order;
      if (order.status === 'PENDING') {
        updatedOrder = await OrderService.transitionOrderStatus(order.id, 'CONFIRMED', {
          userId: order.userId,
          reason: `Paiement confirmé par ${gateway} (ref: ${transactionId})`,
        });
      }

      // Mise à jour du paiement vers COMPLETED
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: {
          status: 'COMPLETED',
          transactionId: transactionId || order.payment?.transactionId,
          gateway,
        },
      });

      // Enregistrement du PaymentEvent
      await tx.paymentEvent.upsert({
        where: { idempotencyKey },
        create: {
          orderId: order.id,
          paymentId: order.payment?.id || null,
          gateway,
          eventType: 'PAYMENT_SUCCESS',
          idempotencyKey,
          payload: rawPayload || {},
          status: 'PROCESSED',
        },
        update: {
          status: 'PROCESSED',
          payload: rawPayload || {},
        },
      });

      // Incrémentation sécurisée des dépenses du client
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { increment: order.totalAmount },
          },
        });
      }

      // Incrémentation des ventes et gains des vendeurs
      for (const item of order.items) {
        if (item.sellerId) {
          await tx.seller.update({
            where: { id: item.sellerId },
            data: {
              totalSales: { increment: item.totalPrice },
              totalEarnings: { increment: item.sellerEarnings },
            },
          });
        }
      }

      // Journal d'audit de confirmation
      await tx.auditLog.create({
        data: {
          userId: order.userId || null,
          action: 'PAYMENT_COMPLETED',
          entity: 'Payment',
          entityId: order.payment?.id || order.id,
          details: { orderNumber: order.orderNumber, gateway, transactionId, amount: order.totalAmount },
        },
      });

      return {
        success: true,
        alreadyProcessed: false,
        order: updatedOrder,
      };
    });
  }

  /**
   * Traitement unifié d'un échec de paiement
   */
  static async processPaymentFailure({ orderId, gateway, transactionId, reason, rawPayload, eventId }) {
    const idempotencyKey = `${gateway}_${transactionId || orderId}_${eventId || 'failure'}`;

    return await db.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: 'FAILED',
          transactionId: transactionId || undefined,
        },
      });

      await tx.paymentEvent.upsert({
        where: { idempotencyKey },
        create: {
          orderId,
          gateway,
          eventType: 'PAYMENT_FAILED',
          idempotencyKey,
          payload: rawPayload || {},
          status: 'PROCESSED',
          errorMessage: reason || 'Paiement échoué',
        },
        update: {
          status: 'PROCESSED',
          errorMessage: reason || 'Paiement échoué',
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_FAILED',
          entity: 'Order',
          entityId: orderId,
          details: { gateway, transactionId, reason },
        },
      });

      return { success: true, status: 'FAILED' };
    });
  }
}

module.exports = PaymentService;
