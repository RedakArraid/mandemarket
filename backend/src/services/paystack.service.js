const PAYSTACK_BASE = 'https://api.paystack.co';

function isConfigured() {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

function getHeaders() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY non configuré. Inscrivez-vous sur https://paystack.com');
  }
  return {
    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

// Normaliser un numéro de téléphone CI au format international Paystack
// Ex: "0703000000" → "2250703000000", "+2250703000000" → "2250703000000"
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('225')) return digits;
  if (digits.length === 10) return `225${digits}`; // CI local
  return digits;
}

// Mapper les opérateurs mandemarket → slug Paystack mobile money
const OPERATOR_SLUG = {
  'mtn_momo':     'mtn',
  'orange_money': 'airtel', // Orange CI utilise le canal Airtel sur Paystack
  'wave':         'wave',
  'moov_money':   'moov',
};

/**
 * Initialiser une transaction Paystack.
 * @param {object} params
 * @param {string} params.orderId
 * @param {number} params.amount       — centimes XOF (stockage DB)
 * @param {string} params.email
 * @param {string} params.callbackUrl
 * @param {string} [params.mobilePhone]     — numéro Mobile Money (optionnel)
 * @param {string} [params.operatorGateway] — 'mtn_momo' | 'orange_money' | 'wave' | 'moov_money'
 */
async function initializeTransaction({ orderId, amount, email, callbackUrl, mobilePhone, operatorGateway }) {
  if (!isConfigured() || /VOTRE|CHANGEZ|xxxx/i.test(process.env.PAYSTACK_SECRET_KEY || '')) {
    throw new Error('Paystack non configuré : renseignez PAYSTACK_SECRET_KEY (clé sk_test_… réelle) dans .env');
  }
  const reference = `MM-${orderId.substring(0, 8).toUpperCase()}-${Date.now()}`;
  const providerSlug = OPERATOR_SLUG[operatorGateway] ?? null;

  const body = {
    email,
    amount,         // centimes XOF = format Paystack XOF
    currency: 'XOF',
    reference,
    callback_url: callbackUrl,
    metadata: { orderId, source: 'mandemarket', operator: operatorGateway ?? 'paystack' },
    channels: providerSlug ? ['mobile_money'] : ['mobile_money', 'card', 'bank'],
  };

  // Pré-remplir le numéro si on connaît l'opérateur et le téléphone
  if (providerSlug && mobilePhone) {
    const normalized = normalizePhone(mobilePhone);
    if (normalized) {
      body.mobile_money = { phone: normalized, provider: providerSlug };
    }
  }

  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!data.status) throw new Error(data.message || 'Erreur Paystack initialize');

  return {
    paymentUrl:  data.data.authorization_url,
    reference:   data.data.reference,
    accessCode:  data.data.access_code,
  };
}

async function verifyTransaction(reference) {
  const response = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: getHeaders() }
  );
  return await response.json();
}

function verifyWebhookSignature(rawBody, signature) {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

module.exports = {
  isConfigured,
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
  OPERATOR_SLUG,
};
