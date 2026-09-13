const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('./db');
const emailService = require('./services/email.service');

// Schéma contact
const contactSchema = z.object({
  name: z.string().min(2, 'Le nom est requis (au moins 2 caractères)'),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().optional().nullable(),
  subject: z.string().min(3, 'Le sujet est requis'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
  honeypot: z.string().optional(), // Anti-spam bot trap
});

// POST /api/contact - Envoi d'un message au support
router.post('/', async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);

    // Protection anti-spam honeypot
    if (data.honeypot && data.honeypot.trim() !== '') {
      console.warn('[Contact] Spam bot détecté via honeypot');
      return res.status(200).json({ success: true, message: 'Message reçu' });
    }

    // Trace en audit log pour observabilité
    await db.auditLog.create({
      data: {
        action: 'CONTACT_MESSAGE_RECEIVED',
        entity: 'Contact',
        entityId: data.email,
        details: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          snippet: data.message.substring(0, 100),
          ip: req.ip,
        },
      },
    });

    // Envoi de la notification par email au support
    await emailService.sendContactMessageNotification({
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
    });

    res.json({
      success: true,
      message: 'Votre message a bien été envoyé. Notre équipe vous répondra dans les plus brefs délais.',
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    console.error('[Contact] Erreur traitement:', err);
    res.status(500).json({ error: 'Erreur lors de l’envoi de votre message' });
  }
});

// Schéma newsletter
const newsletterSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

// In-memory / audit subscriber store
// POST /api/newsletter/subscribe - Inscription newsletter
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = newsletterSchema.parse(req.body);
    const cleanEmail = email.trim().toLowerCase();

    await db.auditLog.create({
      data: {
        action: 'NEWSLETTER_SUBSCRIBED',
        entity: 'Newsletter',
        entityId: cleanEmail,
        details: { email: cleanEmail, ip: req.ip },
      },
    });

    res.json({
      success: true,
      message: 'Merci ! Votre inscription à la newsletter MandeMarket a été prise en compte.',
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Adresse email invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de l’inscription' });
  }
});

// POST /api/newsletter/unsubscribe - Désinscription newsletter
router.post('/newsletter/unsubscribe', async (req, res) => {
  try {
    const { email } = newsletterSchema.parse(req.body);
    const cleanEmail = email.trim().toLowerCase();

    await db.auditLog.create({
      data: {
        action: 'NEWSLETTER_UNSUBSCRIBED',
        entity: 'Newsletter',
        entityId: cleanEmail,
        details: { email: cleanEmail },
      },
    });

    res.json({
      success: true,
      message: 'Votre adresse a été retirée de notre liste de diffusion.',
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Adresse email invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la désinscription' });
  }
});

module.exports = router;
