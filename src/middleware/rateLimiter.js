const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    keyPrefix = 'rl',
  } = options;

  // Check if Redis is available
  const isRedisAvailable = redisClient.client && redisClient.client.status === 'ready';

  if (isRedisAvailable) {
    // Use Redis store if available
    return rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => redisClient.client.call(...args),
        prefix: keyPrefix,
      }),
      windowMs,
      max,
      message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.userId || req.ip;
      },
      skip: (req) => {
        if (process.env.NODE_ENV === 'development' && req.userRole === 'admin') {
          return true;
        }
        return false;
      },
    });
  } else {
    // Fallback to memory store if Redis is not available
    console.warn('Redis not available, using memory store for rate limiting');
    return rateLimit({
      windowMs,
      max,
      message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.userId || req.ip;
      },
      skip: (req) => {
        if (process.env.NODE_ENV === 'development' && req.userRole === 'admin') {
          return true;
        }
        return false;
      },
    });
  }
};

// Specific limiters for different endpoints
const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyPrefix: 'rl-strict',
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'rl-auth',
  message: 'Too many authentication attempts, please try again later.',
});

module.exports = {
  createRateLimiter,
  strictLimiter,
  authLimiter,
};