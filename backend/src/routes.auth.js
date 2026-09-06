const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'mandemarket-secret-key-change-in-production';

// Zod schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

const signupSellerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  storeName: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Middleware pour vérifier le token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Route de vérification du token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ 
      valid: true, 
      user: user 
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Signup + devenir vendeur en 1 clic
router.post('/signup-seller', async (req, res) => {
  try {
    const data = signupSellerSchema.parse(req.body);
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé.' });
    const hash = await bcrypt.hash(data.password, 12);
    const user = await db.user.create({
      data: { email: data.email, password: hash, name: data.name, role: 'user' }
    });
    const slug = (data.slug || data.storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
    const slugExists = await db.seller.findUnique({ where: { slug } });
    if (slugExists) return res.status(409).json({ error: 'Ce nom de boutique est déjà pris.' });
    await db.seller.create({
      data: {
        userId: user.id,
        storeName: data.storeName,
        slug,
        description: data.description,
        status: 'pending'
      }
    });
    await db.user.update({ where: { id: user.id }, data: { role: 'seller' } });
    const token = jwt.sign({ userId: user.id, role: 'seller' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: 'seller' },
      message: 'Inscription envoyée. Votre compte vendeur sera activé après vérification.'
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Données invalides', details: err.errors });
    res.status(500).json({ error: err.message || 'Erreur' });
  }
});

// Signup (Register)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);
    
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email déjà utilisé.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await db.user.create({ 
      data: { 
        email, 
        password: hash, 
        name,
        role: 'user'
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur signup:', err);
    if (err.errors) {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    res.status(400).json({ error: err.message || 'Erreur lors de l\'inscription' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Erreur login:', err);
    if (err.errors) {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    res.status(400).json({ error: err.message || 'Erreur lors de la connexion' });
  }
});

// Route de logout (côté serveur, pour nettoyer si nécessaire)
router.post('/logout', verifyToken, (req, res) => {
  // Dans une implémentation avec blacklist de tokens, on l'ajouterait ici
  res.json({ message: 'Déconnexion réussie' });
});

// Route pour récupérer le profil utilisateur
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Export du middleware pour utilisation dans d'autres routes
router.verifyToken = verifyToken;

module.exports = router;
