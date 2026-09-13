/**
 * Service Redis MandeMarket (MM-INF-090)
 * Gère le cache, les verrous et le rate limiting distribué si configuré.
 * Bascule automatiquement en mode no-op / in-memory si REDIS_URL n'est pas défini.
 */

let Redis;
try {
  Redis = require('ioredis');
} catch {
  Redis = null;
}

let redisClient = null;
let isConnected = false;

const redisUrl = process.env.REDIS_URL;

if (redisUrl && Redis) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) return null; // Arrêter après 3 essais pour ne pas bloquer l'app
        return Math.min(times * 100, 2000);
      },
      connectTimeout: 3000,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('[Redis] Connecté avec succès');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Log discret pour éviter de polluer en dev sans Redis
      if (process.env.NODE_ENV === 'production') {
        console.warn('[Redis] Erreur de connexion:', err.message);
      }
    });

    // Tentative de connexion non bloquante
    redisClient.connect().catch((err) => {
      isConnected = false;
      if (process.env.NODE_ENV === 'production') {
        console.warn('[Redis] Impossible de joindre le serveur Redis:', err.message);
      }
    });
  } catch (err) {
    console.warn('[Redis] Initialisation échouée, fallback in-memory:', err.message);
    redisClient = null;
  }
}

// Fallback in-memory pour développement sans serveur Redis
const memoryStore = new Map();

class RedisService {
  static isAvailable() {
    return isConnected && redisClient !== null;
  }

  static async ping() {
    if (this.isAvailable()) {
      try {
        const res = await redisClient.ping();
        return res === 'PONG';
      } catch {
        return false;
      }
    }
    return false;
  }

  static async get(key) {
    try {
      if (this.isAvailable()) {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      }
      const item = memoryStore.get(key);
      if (item && item.expiry > Date.now()) {
        return item.value;
      }
      memoryStore.delete(key);
      return null;
    } catch {
      return null;
    }
  }

  static async set(key, value, ttlSeconds = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (this.isAvailable()) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
        return true;
      }
      memoryStore.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000,
      });
      return true;
    } catch {
      return false;
    }
  }

  static async del(key) {
    try {
      if (this.isAvailable()) {
        await redisClient.del(key);
        return true;
      }
      memoryStore.delete(key);
      return true;
    } catch {
      return false;
    }
  }

  static getClient() {
    return redisClient;
  }
}

module.exports = RedisService;
