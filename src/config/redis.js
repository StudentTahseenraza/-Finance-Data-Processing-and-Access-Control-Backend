const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
      });

      await this.client.ping();
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      return null;
    }
  }

  async get(key) {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.client) return false;
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
      return false;
    }
  }

  async clearPattern(pattern) {
    if (!this.client) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis clear pattern error:`, error);
      return false;
    }
  }
}

module.exports = new RedisClient();