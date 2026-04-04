const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/AppError');
const logger = require('../utils/logger');
const User = require('../models/User');
const redisClient = require('../config/redis');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash', 'refresh_token'] },
      include: ['role'],
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.status !== 'active') {
      throw new AuthenticationError('Account is inactive or suspended');
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role.name;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
      });
    }
    next(error);
  }
};

module.exports = authMiddleware;