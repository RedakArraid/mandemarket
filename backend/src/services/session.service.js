const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { JWT_SECRET } = require('../config/env');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_DAYS = 7;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

async function createSession(userId, req) {
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      ipAddress: typeof ipAddress === 'string' ? ipAddress.slice(0, 45) : null,
      userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : null,
      expiresAt,
    },
  });

  return {
    sessionId: session.id,
    refreshToken: rawRefreshToken,
    expiresAt,
  };
}

async function rotateRefreshToken(rawRefreshToken, req) {
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    throw new Error('Refresh token manquant ou invalide');
  }

  const tokenHash = hashToken(rawRefreshToken);

  const existingSession = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existingSession) {
    throw new Error('Session introuvable');
  }

  if (existingSession.revokedAt) {
    // Détection de rejeu possible : révoquer toutes les sessions de cet utilisateur par sécurité
    await db.session.updateMany({
      where: { userId: existingSession.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new Error('Session déjà révoquée. Toutes les sessions ont été invalidées par sécurité.');
  }

  if (new Date() > existingSession.expiresAt) {
    await db.session.update({
      where: { id: existingSession.id },
      data: { revokedAt: new Date() },
    });
    throw new Error('Session expirée');
  }

  // Révoquer l'ancienne session
  await db.session.update({
    where: { id: existingSession.id },
    data: { revokedAt: new Date() },
  });

  // Créer une nouvelle session rotative
  const newSessionData = await createSession(existingSession.userId, req);
  const newAccessToken = generateAccessToken(existingSession.user);

  return {
    accessToken: newAccessToken,
    refreshToken: newSessionData.refreshToken,
    expiresAt: newSessionData.expiresAt,
    user: {
      id: existingSession.user.id,
      email: existingSession.user.email,
      name: existingSession.user.name,
      role: existingSession.user.role,
    },
  };
}

async function revokeSessionByToken(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await db.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function revokeSessionById(sessionId, userId) {
  return db.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function revokeAllUserSessions(userId) {
  return db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function getUserSessions(userId) {
  const sessions = await db.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return sessions;
}

// Réinitialisation de mot de passe sécurisée
async function createPasswordResetToken(email) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Retourner silencieusement pour éviter l'énumération des comptes
    return null;
  }

  // Invalider les anciens tokens de reset non utilisés
  await db.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, email: user.email, name: user.name };
}

async function resetPasswordWithToken(rawToken, newPassword) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Jeton de réinitialisation manquant');
  }

  const tokenHash = hashToken(rawToken);

  const resetRecord = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
    throw new Error('Jeton de réinitialisation invalide ou expiré');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Mettre à jour le mot de passe, marquer le jeton comme utilisé et révoquer toutes les sessions
  await db.$transaction([
    db.user.update({
      where: { id: resetRecord.userId },
      data: { password: passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    db.session.updateMany({
      where: { userId: resetRecord.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        userId: resetRecord.userId,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: resetRecord.userId,
        details: { method: 'token_reset' },
      },
    }),
  ]);

  return { success: true, email: resetRecord.user.email };
}

module.exports = {
  hashToken,
  generateAccessToken,
  createSession,
  rotateRefreshToken,
  revokeSessionByToken,
  revokeSessionById,
  revokeAllUserSessions,
  getUserSessions,
  createPasswordResetToken,
  resetPasswordWithToken,
};
