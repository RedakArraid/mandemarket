const { PrismaClient } = require('@prisma/client');

/** Singleton Prisma — évite d'ouvrir une connexion par requête / fichier de routes. */
const globalForPrisma = globalThis;

const db =
  globalForPrisma.__mandemarketPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__mandemarketPrisma = db;
}

module.exports = db;
