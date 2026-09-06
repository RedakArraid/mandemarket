const express = require('express');
const { detectRegion } = require('./utils/region');
const router = express.Router();
const db = require('./db');

// POST /api/payment/initiate
// Body: { orderId, gateway?: string, returnBaseUrl?: string }
// Gateway par région : africa → paystack (ou cinetpay en fallback), europe → stripe
router.post('/initiate', async (req, res) => {
  try {
    const { orderId, gateway, returnBaseUrl } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId requis' });

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { customer: { include: { address: true } }, payment: true },
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const BASE_URL = returnBaseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const API_BASE = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
    const successUrl = `${BASE_URL}/checkout/success?orderId=${orderId}`;
    const cancelUrl = `${BASE_URL}/checkout/cancel?orderId=${orderId}`;

    // Détecter la région à partir du pays de livraison
    const countryInput = order.customer?.address?.country || 'CI';
    const region = detectRegion(countryInput);

    // Opérateurs Mobile Money CI → tous routés vers Paystack avec canal spécifique
    const CI_MOBILE_OPERATORS = new Set(['mtn_momo', 'orange_money', 'wave', 'moov_money']);

    // Choisir la passerelle selon la région et la disponibilité
    let effectiveGateway = gateway;
    let operatorGateway = null; // opérateur CI si applicable

    if (CI_MOBILE_OPERATORS.has(effectiveGateway)) {
      operatorGateway = effectiveGateway; // conserver pour Paystack
      effectiveGateway = 'paystack';
    }

    if (!effectiveGateway) {
      effectiveGateway = region === 'europe' ? 'stripe' : 'paystack';
    }

    // Forcer la passerelle correcte si incohérente avec la région
    if (region === 'europe' && effectiveGateway === 'paystack') effectiveGateway = 'stripe';
    if (region === 'europe' && effectiveGateway === 'cinetpay') effectiveGateway = 'stripe';
    if (region === 'africa' && effectiveGateway === 'stripe') effectiveGateway = 'paystack';

    let result;

    if (effectiveGateway === 'paystack') {
      const paystackService = require('./services/paystack.service');
      if (!paystackService.isConfigured()) {
        // Fallback vers CinetPay si Paystack non configuré
        const cinetpay = require('./services/cinetpay.service');
        const notifyUrl = `${API_BASE}/api/payment/notify/cinetpay`;
        result = await cinetpay.initiatePayment({
          orderId, amount: order.totalAmount, customer: order.customer, returnUrl: successUrl, notifyUrl,
        });
        effectiveGateway = 'cinetpay';
      } else {
        result = await paystackService.initializeTransaction({
          orderId,
          amount: order.totalAmount,
          email: order.customer.email,
          callbackUrl: successUrl,
          mobilePhone: order.customer.phone,
          operatorGateway,
        });
      }
    } else if (effectiveGateway === 'stripe') {
      const stripeService = require('./services/stripe.service');
      const currency = region === 'europe' ? 'eur' : 'xof';
      result = await stripeService.createCheckoutSession({
        orderId, amount: order.totalAmount, customer: order.customer, successUrl, cancelUrl, currency,
      });
    } else if (effectiveGateway === 'cinetpay') {
      const cinetpay = require('./services/cinetpay.service');
      const notifyUrl = `${API_BASE}/api/payment/notify/cinetpay`;
      result = await cinetpay.initiatePayment({
        orderId, amount: order.totalAmount, customer: order.customer, returnUrl: successUrl, notifyUrl,
      });
    } else {
      return res.status(400).json({ error: `Passerelle inconnue: ${effectiveGateway}` });
    }

    // Sauvegarder gateway + transactionId
    await db.payment.update({
      where: { orderId },
      data: {
        gateway: effectiveGateway,
        transactionId: result.sessionId || result.reference || result.transactionId || orderId,
        status: 'PROCESSING',
      },
    }).catch(() => {});

    res.json({ paymentUrl: result.paymentUrl, gateway: effectiveGateway, region });
  } catch (err) {
    console.error('[Payment] Erreur initiation:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/webhook/paystack
// Le corps brut est fourni par app.js (express.raw) pour la vérif HMAC.
router.post('/webhook/paystack', async (req, res) => {
  try {
    const paystackService = require('./services/paystack.service');
    const signature = req.headers['x-paystack-signature'];
    const raw = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {});

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.warn('[Paystack Webhook] PAYSTACK_SECRET_KEY manquant');
      return res.status(503).send('Webhook non configuré');
    }
    if (!signature || !paystackService.verifyWebhookSignature(raw, signature)) {
      console.warn('[Paystack Webhook] Signature invalide ou absente');
      return res.status(401).send('Signature invalide');
    }

    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      return res.status(400).send('JSON invalide');
    }

    console.log('[Paystack Webhook]', event?.event, event?.data?.reference);

    if (event?.event === 'charge.success') {
      const { reference, metadata, status } = event.data || {};
      const orderId = metadata?.orderId;

      if (orderId && status === 'success') {
        await db.payment.updateMany({
          where: { orderId },
          data: { status: 'COMPLETED', transactionId: reference },
        });
        await db.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } }).catch(() => {});
        console.log(`[Paystack] Paiement confirmé pour commande ${orderId}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Paystack Webhook] Erreur:', err);
    res.status(200).json({ received: true });
  }
});

// POST /api/payment/notify/cinetpay
router.post('/notify/cinetpay', async (req, res) => {
  try {
    const { cpm_trans_id, cpm_result } = req.body;
    console.log('[CinetPay Webhook]', { cpm_trans_id, cpm_result });

    if (cpm_trans_id) {
      const isPaid = cpm_result === '00';
      const orderId = cpm_trans_id;

      await db.payment.updateMany({
        where: { orderId },
        data: { status: isPaid ? 'COMPLETED' : 'FAILED', transactionId: cpm_trans_id },
      });

      if (isPaid) {
        await db.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } }).catch(() => {});
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('[CinetPay Webhook] Erreur:', err);
    res.status(200).send('OK');
  }
});

// POST /api/payment/webhook/stripe
// Corps brut monté dans app.js — ne pas re-parser ici.
router.post('/webhook/stripe', async (req, res) => {
  try {
    const stripeService = require('./services/stripe.service');
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = await stripeService.constructWebhookEvent(req.body, sig);
    } catch (err) {
      console.error('[Stripe Webhook] Signature invalide:', err.message);
      return res.status(400).send('Signature invalide');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId) {
        await db.payment.updateMany({
          where: { orderId },
          data: { status: 'COMPLETED', transactionId: session.id },
        });
        await db.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } }).catch(() => {});
        console.log(`[Stripe] Paiement confirmé pour commande ${orderId}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Erreur:', err);
    res.status(500).json({ error: 'Erreur webhook' });
  }
});

// GET /api/payment/status/:orderId
router.get('/status/:orderId', async (req, res) => {
  try {
    const payment = await db.payment.findUnique({ where: { orderId: req.params.orderId } });
    const order = await db.order.findUnique({ where: { id: req.params.orderId }, select: { status: true } });
    res.json({ payment, orderStatus: order?.status });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/payment/verify/paystack/:reference - Vérification manuelle
router.get('/verify/paystack/:reference', async (req, res) => {
  try {
    const paystackService = require('./services/paystack.service');
    const data = await paystackService.verifyTransaction(req.params.reference);
    if (data.status && data.data?.status === 'success') {
      const orderId = data.data?.metadata?.orderId;
      if (orderId) {
        await db.payment.updateMany({
          where: { orderId },
          data: { status: 'COMPLETED', transactionId: req.params.reference },
        });
        await db.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } }).catch(() => {});
      }
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
