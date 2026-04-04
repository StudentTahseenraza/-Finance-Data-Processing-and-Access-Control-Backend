const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const redisClient = require('../config/redis');
const { AuthenticationError, ValidationError } = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthService {
  async register(userData, ipAddress, userAgent) {
    // Check if user exists
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

    // Create user
    const user = await User.create({
      ...userData,
      role_id: defaultRole.id,
    });

    // Log audit
    await AuditLog.create({
      user_id: user.id,
      action: 'REGISTER',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    await user.update({ refresh_token: tokens.refreshToken });

    // Remove sensitive data
    const userResponse = this.sanitizeUser(user);

    return {
      user: userResponse,
      ...tokens,
    };
  }

  async login(email, password, ipAddress, userAgent) {
    // Find user with role
    const user = await User.findOne({
      where: { email },
      include: ['role'],
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new AuthenticationError(
        'Account is locked due to multiple failed attempts. Please try again later.'
      );
    }

    // Validate password
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      throw new AuthenticationError('Invalid credentials');
    }

    // Check account status
    if (user.status !== 'active') {
      throw new AuthenticationError(`Account is ${user.status}`);
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    await user.update({ refresh_token: tokens.refreshToken });

    // Log audit
    await AuditLog.create({
      user_id: user.id,
      action: 'LOGIN',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Remove sensitive data
    const userResponse = this.sanitizeUser(user);

    return {
      user: userResponse,
      ...tokens,
    };
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