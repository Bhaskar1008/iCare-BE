import { logger } from '../utils/logger.js';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  async get(key) {
    try {
      const item = this.cache.get(key);

      if (!item) {
        this.stats.misses++;
        return null;
      }

      if (item.expiresAt && item.expiresAt < Date.now()) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return item.value;
    } catch (error) {
      logger.error({
        error,
        key,
      }, 'Cache get operation failed');
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      this.cache.set(key, {
        value,
        expiresAt: ttl ? Date.now() + (ttl * 1000) : null,
      });

      this.stats.sets++;

      logger.debug({
        key,
        ttl,
      }, 'Cache set successfully');
    } catch (error) {
      logger.error({
        error,
        key,
      }, 'Cache set operation failed');
      throw error;
    }
  }

  async delete(key) {
    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.deletes++;
      }
      return deleted;
    } catch (error) {
      logger.error({
        error,
        key,
      }, 'Cache delete operation failed');
      throw error;
    }
  }

  async clear() {
    try {
      this.cache.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error({
        error,
      }, 'Cache clear operation failed');
      throw error;
    }
  }

  async getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }
}

export const cacheService = new CacheService();