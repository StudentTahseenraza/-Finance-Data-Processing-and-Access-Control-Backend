const authService = require('../services/authService');
const { ValidationError } = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, full_name } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await authService.register(
        { email, password_hash: password, full_name },
        ipAddress,
        userAgent
      );

      res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await authService.login(
        email,
        password,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      await authService.logout(req.userId, token, ipAddress, userAgent);

      res.status(200).json({
        status: 'success',
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const tokens = await authService.refreshToken(
        refresh_token,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        status: 'success',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      res.status(200).json({
        status: 'success',
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();