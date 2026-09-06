const nodemailer = require('nodemailer');

const isConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () => {
  if (!isConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false }
  });
};

const FROM = process.env.EMAIL_FROM || 'MandeMarket <noreply@mandemarket.com>';

async function sendEmail({ to, subject, html }) {
  if (!isConfigured()) {
    console.log(`[Email] SMTP non configuré - Email ignoré: ${subject} → ${to}`);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[Email] Envoyé: ${subject} → ${to}`);
  } catch (err) {
    console.error(`[Email] Erreur envoi: ${err.message}`);
  }
}

// Templates HTML - style minimal mais professionnel
const baseTemplate = (content) => `
<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f9f5f0; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 28px; }
  .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; }
  .body { padding: 30px; }
  .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-confirmed { background: #dbeafe; color: #1e40af; }
  .badge-shipped { background: #fed7aa; color: #c2410c; }
  .badge-delivered { background: #d1fae5; color: #065f46; }
  .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px; color: #f97316; }
  .btn { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
  .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
</style></head><body>
<div class="container">
  <div class="header"><h1>MandeMarket</h1><p>Votre marketplace de confiance</p></div>
  <div class="body">${content}</div>
  <div class="footer">© ${new Date().getFullYear()} MandeMarket - Côte d'Ivoire<br>
  Vous recevez cet email car vous avez effectué une action sur notre plateforme.</div>
</div></body></html>`;

const STATUS_LABELS = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée'
};

const STATUS_BADGE_CLASS = {
  PENDING: 'pending', CONFIRMED: 'confirmed', SHIPPED: 'shipped', DELIVERED: 'delivered'
};

// Email: Confirmation de commande
async function sendOrderConfirmation(customer, order) {
  const itemsHtml = (order.items || []).map(item =>
    `<div class="item-row">
      <span>${item.product?.name || 'Produit'} × ${item.quantity}</span>
      <span>${Math.round(item.totalPrice / 100).toLocaleString()} FCFA</span>
    </div>`
  ).join('');

  const html = baseTemplate(`
    <h2 style="color: #111827;">Merci pour votre commande ! 🎉</h2>
    <p>Bonjour <strong>${customer.firstName}</strong>,</p>
    <p>Votre commande a bien été reçue. Nous vous contacterons prochainement pour confirmer la livraison.</p>

    <div style="background: #f9f5f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Numéro de commande</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #f97316; letter-spacing: 2px;">#${order.id.substring(0, 8).toUpperCase()}</p>
    </div>

    <h3 style="color: #374151; margin-top: 24px;">Récapitulatif</h3>
    ${itemsHtml}
    <div class="total-row">
      <span>Total</span>
      <span>${Math.round(order.totalAmount / 100).toLocaleString()} FCFA</span>
    </div>

    <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
      Livraison estimée sous <strong>48h à 72h</strong> à Abidjan.<br>
      Pour toute question: <a href="mailto:contact@mandemarket.com" style="color: #f97316;">contact@mandemarket.com</a>
    </p>
  `);

  await sendEmail({ to: customer.email, subject: `Commande #${order.id.substring(0, 8).toUpperCase()} confirmée - MandeMarket`, html });
}

// Email: Mise à jour statut commande
async function sendOrderStatusUpdate(customer, order, newStatus) {
  const label = STATUS_LABELS[newStatus] || newStatus;
  const badgeClass = STATUS_BADGE_CLASS[newStatus] || 'pending';

  const messages = {
    CONFIRMED: 'Votre commande a été confirmée par notre équipe.',
    PROCESSING: 'Votre commande est en cours de préparation.',
    SHIPPED: 'Votre commande a été expédiée et est en route !',
    DELIVERED: 'Votre commande a été livrée. Merci pour votre achat !',
    CANCELLED: 'Votre commande a été annulée. Contactez-nous pour plus d\'infos.',
    REFUNDED: 'Votre remboursement est en cours de traitement.'
  };

  const html = baseTemplate(`
    <h2 style="color: #111827;">Mise à jour de votre commande</h2>
    <p>Bonjour <strong>${customer.firstName}</strong>,</p>
    <p>Votre commande <strong>#${order.id.substring(0, 8).toUpperCase()}</strong> a changé de statut :</p>

    <div style="text-align: center; margin: 24px 0;">
      <span class="badge badge-${badgeClass}" style="font-size: 18px; padding: 10px 24px;">${label}</span>
    </div>

    <p>${messages[newStatus] || 'Votre commande a été mise à jour.'}</p>

    ${newStatus === 'SHIPPED' && order.shipping?.trackingCode ?
      `<p>📦 Numéro de suivi: <strong>${order.shipping.trackingCode}</strong></p>` : ''}
  `);

  await sendEmail({ to: customer.email, subject: `Commande #${order.id.substring(0, 8).toUpperCase()} - ${label}`, html });
}

// Email: Bienvenue nouveau client
async function sendWelcomeEmail(customer) {
  const html = baseTemplate(`
    <h2 style="color: #111827;">Bienvenue sur MandeMarket ! 🎉</h2>
    <p>Bonjour <strong>${customer.firstName}</strong>,</p>
    <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
    <ul style="color: #374151; line-height: 2;">
      <li>Parcourir notre catalogue de sacs et accessoires</li>
      <li>Suivre vos commandes en temps réel</li>
      <li>Accumuler des points fidélité</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/boutique" class="btn">
        Découvrir la boutique
      </a>
    </div>
  `);
  await sendEmail({ to: customer.email, subject: 'Bienvenue sur MandeMarket !', html });
}

// Email: Approbation vendeur
async function sendSellerApproval(sellerEmail, sellerName, storeName) {
  const html = baseTemplate(`
    <h2 style="color: #111827;">Votre boutique est approuvée ! 🎊</h2>
    <p>Bonjour <strong>${sellerName}</strong>,</p>
    <p>Félicitations ! Votre boutique <strong>${storeName}</strong> a été approuvée sur MandeMarket.</p>
    <p>Vous pouvez maintenant :</p>
    <ul style="color: #374151; line-height: 2;">
      <li>Ajouter vos produits depuis votre tableau de bord vendeur</li>
      <li>Gérer vos commandes et vos revenus</li>
      <li>Configurer vos informations de paiement</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/vendeur/dashboard" class="btn">
        Accéder à mon tableau de bord
      </a>
    </div>
  `);
  await sendEmail({ to: sellerEmail, subject: `Votre boutique ${storeName} est approuvée !`, html });
}

// Email: Nouvelle commande (notification admin)
async function sendNewOrderNotification(order, customer) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@mandemarket.com';
  const html = baseTemplate(`
    <h2 style="color: #111827;">Nouvelle commande reçue</h2>
    <p>Commande <strong>#${order.id.substring(0, 8).toUpperCase()}</strong></p>
    <p>Client: ${customer.firstName} ${customer.lastName} (${customer.email})</p>
    <p>Montant: <strong>${Math.round(order.totalAmount / 100).toLocaleString()} FCFA</strong></p>
    <p>Articles: ${(order.items || []).length}</p>
  `);
  await sendEmail({ to: adminEmail, subject: `Nouvelle commande #${order.id.substring(0, 8).toUpperCase()}`, html });
}

module.exports = { sendOrderConfirmation, sendOrderStatusUpdate, sendWelcomeEmail, sendSellerApproval, sendNewOrderNotification };
