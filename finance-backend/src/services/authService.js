const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const redisClient = require('../config/redis');
const { AuthenticationError, ValidationError } = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthService {
  async login(email, password, ipAddress, userAgent) {
  try {
    // Find user WITHOUT include first to avoid association error
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Get role separately
    const role = await Role.findByPk(user.role_id);
    
    // Attach role to user object
    user.role = role;

    // Check if account is locked
    if (user.isLocked()) {
      throw new AuthenticationError('Account is locked due to multiple failed attempts');
    }

    // Validate password
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      throw new AuthenticationError('Invalid credentials');
    }

    // Rest of your login logic...
    await user.resetLoginAttempts();
    await user.update({ last_login: new Date() });
    
    const tokens = this.generateTokens(user);
    await user.update({ refresh_token: tokens.refreshToken });
    
    const userResponse = this.sanitizeUser(user);
    userResponse.role = role;

    return {
      user: userResponse,
      ...tokens,
    };
  } catch (error) {
    throw error;
  }
}

async register(userData, ipAddress, userAgent) {
  try {
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Get default role (viewer)
    const defaultRole = await Role.findOne({
      where: { name: 'viewer' },
    });

    if (!defaultRole) {
      throw new Error('Default role not found');
    }

    const user = await User.create({
      ...userData,
      role_id: defaultRole.id,
    });

    const tokens = this.generateTokens(user);
    await user.update({ refresh_token: tokens.refreshToken });

    const userResponse = this.sanitizeUser(user);
    userResponse.role = defaultRole;

    return {
      user: userResponse,
      ...tokens,
    };
  } catch (error) {
    throw error;
  }
}

  async logout(userId, token, ipAddress, userAgent) {
    // Blacklist the token
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redisClient.set(`blacklist:${token}`, true, ttl);
      }
    }

    // Clear refresh token
    await User.update(
      { refresh_token: null },
      { where: { id: userId } }
    );

    // Log audit
    await AuditLog.create({
      user_id: userId,
      action: 'LOGOUT',
      resource_type: 'user',
      resource_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async refreshToken(refreshToken, ipAddress, userAgent) {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Find user
    const user = await User.findOne({
      where: {
        id: decoded.id,
        refresh_token: refreshToken,
        status: 'active',
      },
      include: ['role'],
    });

    if (!user) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Update refresh token
    await user.update({ refresh_token: tokens.refreshToken });

    // Log audit
    await AuditLog.create({
      user_id: user.id,
      action: 'REFRESH_TOKEN',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return tokens;
  }

  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role?.name,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    });

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      }
    );

    return { accessToken, refreshToken };
  }

  sanitizeUser(user) {
    const { password_hash, refresh_token, ...sanitized } = user.toJSON();
    return sanitized;
  }
}

module.exports = new AuthService();