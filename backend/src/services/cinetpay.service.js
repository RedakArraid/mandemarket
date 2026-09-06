// Uses native fetch from Node 18+
const CINETPAY_API = 'https://api-checkout.cinetpay.com/v2/payment';

async function initiatePayment({ orderId, amount, customer, returnUrl, notifyUrl }) {
  if (!process.env.CINETPAY_API_KEY || !process.env.CINETPAY_SITE_ID) {
    throw new Error('CinetPay non configuré. Définissez CINETPAY_API_KEY et CINETPAY_SITE_ID');
  }
  // amount est en centimes → diviser par 100 pour FCFA
  const amountFCFA = Math.round(amount / 100);

  const payload = {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: orderId,
    amount: amountFCFA,
    currency: 'XOF',
    description: `Commande MandeMarket #${orderId.substring(0, 8).toUpperCase()}`,
    return_url: returnUrl,
    notify_url: notifyUrl,
    lang: 'fr',
    channels: 'ALL',
    customer_name: `${customer.firstName} ${customer.lastName}`,
    customer_email: customer.email,
    customer_phone_number: customer.phone || '',
    customer_address: customer.address?.street || 'Abidjan',
    customer_city: customer.address?.city || 'Abidjan',
    customer_country: 'CI',
    customer_state: 'CI',
    customer_zip_code: customer.address?.postalCode || '00225',
    metadata: JSON.stringify({ orderId })
  };

  const response = await fetch(CINETPAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (data.code === '201') {
    return { paymentUrl: data.data.payment_url, transactionId: data.data.transaction_id || orderId };
  }
  throw new Error(data.message || `Erreur CinetPay code ${data.code}`);
}

async function verifyPayment(transactionId) {
  if (!process.env.CINETPAY_API_KEY || !process.env.CINETPAY_SITE_ID) return null;

  const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId
    })
  });
  const data = await response.json();
  return data;
}

module.exports = { initiatePayment, verifyPayment };
