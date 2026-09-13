const jwt = require('jsonwebtoken');
const db = require('./db');

const { JWT_SECRET } = require('./config/env');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès admin requis' });
  }
  next();
}

function requireRole(role) {
  return function (req, res, next) {
    if (!req.user || (Array.isArray(role) ? !role.includes(req.user.role) : req.user.role !== role)) {
      return res.status(403).json({
        error: 'Accès réservé au rôle : ' + (Array.isArray(role) ? role.join(', ') : role),
      });
    }
    next();
  };
}

async function requireSeller(req, res, next) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId: req.user.userId },
    });
    if (!seller || seller.status !== 'approved') {
      return res.status(403).json({
        error: "Espace vendeur non accessible. Compte vendeur requis ou en attente d'approbation.",
      });
    }
    req.seller = seller;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { requireAuth, requireAdmin, requireRole, requireSeller };
