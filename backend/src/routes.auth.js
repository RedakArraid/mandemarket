const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('./db');
const { requireAuth } = require('./middleware.auth');
const sessionService = require('./services/session.service');

// Schémas de validation Zod stricts
const passwordRule = z
  .string()
  .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit comporter au moins une lettre majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit comporter au moins un chiffre');

const signupSchema = z.object({
  email: z.string().email('Format email invalide').toLowerCase().trim(),
  password: passwordRule,
  name: z.string().min(2, 'Le nom doit comporter au moins 2 caractères').trim(),
  // Interdiction formelle d'injecter un rôle (MM-BE-022)
});

const signupSellerSchema = z.object({
  email: z.string().email('Format email invalide').toLowerCase().trim(),
  password: passwordRule,
  name: z.string().min(2).trim(),
  storeName: z.string().min(2).max(100).trim(),
  slug: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Mot de passe requis'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Jeton invalide'),
  newPassword: passwordRule,
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà associé à un compte.' });
    }

    const hash = await bcrypt.hash(password, 12);

    // Transaction atomique : création User + rattachement Customer
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hash,
          name,
          role: 'customer', // Rôle par défaut sécurisé (client)
        },
      });

      // Synchroniser ou créer la fiche Customer liée
      await tx.customer.upsert({
        where: { email },
        update: { userId: newUser.id, firstName: name.split(' ')[0] || name, lastName: name.split(' ').slice(1).join(' ') || '' },
        create: {
          userId: newUser.id,
          email,
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || '',
        },
      });

      return newUser;
    });

    const accessToken = sessionService.generateAccessToken(user);
    const sessionData = await sessionService.createSession(user.id, req);

    res.status(201).json({
      accessToken,
      refreshToken: sessionData.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ error: 'Validation échouée', details: err.errors });
    }
    console.error('Erreur signup:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de l’inscription' });
  }
});

// POST /api/auth/signup-seller
router.post('/signup-seller', async (req, res) => {
  try {
    const data = signupSellerSchema.parse(req.body);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(data.password, 12);
    const slug = data.slug || data.storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const slugExists = await db.seller.findUnique({ where: { slug } });
    if (slugExists) {
      return res.status(409).json({ error: 'Ce nom de boutique est déjà pris.' });
    }

    const { user, seller } = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hash,
          name: data.name,
          role: 'seller',
        },
      });

      const newSeller = await tx.seller.create({
        data: {
          userId: newUser.id,
          storeName: data.storeName,
          slug,
          description: data.description || null,
          status: 'pending',
        },
      });

      return { user: newUser, seller: newSeller };
    });

    const accessToken = sessionService.generateAccessToken(user);
    const sessionData = await sessionService.createSession(user.id, req);

    res.status(201).json({
      accessToken,
      refreshToken: sessionData.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        seller: {
          id: seller.id,
          storeName: seller.storeName,
          slug: seller.slug,
          status: seller.status,
        },
      },
      message: 'Compte vendeur créé. Votre boutique sera active après validation par l’administrateur.',
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ error: 'Validation échouée', details: err.errors });
    }
    console.error('Erreur signup-seller:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de l’inscription vendeur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db.user.findUnique({
      where: { email },
      include: {
        seller: {
          select: { id: true, storeName: true, slug: true, status: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const accessToken = sessionService.generateAccessToken(user);
    const sessionData = await sessionService.createSession(user.id, req);

    res.json({
      accessToken,
      refreshToken: sessionData.refreshToken,
      token: accessToken, // Rétrocompatibilité frontend
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        seller: user.seller,
        customer: user.customer,
      },
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    console.error('Erreur login:', err);
    res.status(400).json({ error: 'Erreur lors de la connexion' });
  }
});

// POST /api/auth/refresh (Rotation de refresh token)
router.post('/refresh', async (req, res) => {
  const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token manquant' });
  }

  try {
    const result = await sessionService.rotateRefreshToken(refreshToken, req);
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      token: result.accessToken, // Rétrocompatibilité
      user: result.user,
    });
  } catch (err) {
    console.warn('[AUTH] Échec rotation refresh token:', err.message);
    res.status(401).json({ error: err.message || 'Session invalide' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
  if (refreshToken) {
    await sessionService.revokeSessionByToken(refreshToken).catch(() => {});
  }
  res.json({ message: 'Déconnexion réussie' });
});

// POST /api/auth/logout-all
router.post('/logout-all', requireAuth, async (req, res) => {
  try {
    await sessionService.revokeAllUserSessions(req.user.userId);
    res.json({ message: 'Toutes les sessions ont été déconnectées' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la déconnexion globale' });
  }
});

// GET /api/auth/me & /api/auth/profile
router.get(['/me', '/profile', '/verify'], requireAuth, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        seller: {
          select: { id: true, storeName: true, slug: true, status: true, rating: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json({ valid: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.userId);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les sessions' });
  }
});

// DELETE /api/auth/sessions/:id
router.delete('/sessions/:id', requireAuth, async (req, res) => {
  try {
    await sessionService.revokeSessionById(req.params.id, req.user.userId);
    res.json({ message: 'Session révoquée avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de révoquer la session' });
  }
});

// POST /api/auth/forgot-password (Réponse neutre sans énumération d'emails)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const resetInfo = await sessionService.createPasswordResetToken(email);

    // En environnement de développement ou test, journaliser le token si pas d'envoi SMTP
    if (resetInfo && process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Jeton de réinitialisation pour ${email}: ${resetInfo.rawToken}`);
    }

    // Réponse toujours positive pour la sécurité (anti-énumération)
    res.json({
      message: 'Si cet email est associé à un compte, des instructions de réinitialisation ont été envoyées.',
    });
  } catch (err) {
    res.status(400).json({ error: 'Format email invalide' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await sessionService.resetPasswordWithToken(token, newPassword);
    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Lien invalide ou expiré' });
  }
});

module.exports = router;
