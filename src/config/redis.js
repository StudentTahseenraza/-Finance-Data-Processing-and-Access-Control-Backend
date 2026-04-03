const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Check if Redis is configured and we should connect
      const shouldConnect = process.env.REDIS_HOST && 
                           process.env.REDIS_HOST !== 'localhost' ||
                           process.env.NODE_ENV === 'production';
      
      // In development, we can run without Redis
      if (process.env.NODE_ENV === 'development' && !process.env.REDIS_HOST) {
        logger.warn('Redis not configured. Running without cache. Set REDIS_HOST to enable caching.');
        return null;
      }

      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          if (times > 3) {
            logger.warn('Redis connection failed after multiple retries, continuing without cache');
            return null; // Stop retrying
          }
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't connect immediately
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error:', error.message);
      });

      // Try to connect
      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error.message);
      this.client = null;
      this.isConnected = false;
      return null;
    }
  }

  async get(key) {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.client || !this.isConnected) return false;
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.client || !this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error.message);
      return false;
    }
  }

  async clearPattern(pattern) {
    if (!this.client || !this.isConnected) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis clear pattern error:`, error.message);
      return false;
    }
  }
}

module.exports = new RedisClient();