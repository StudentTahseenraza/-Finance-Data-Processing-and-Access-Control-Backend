const userService = require('../services/userService');
const { userSchema } = require('../utils/validators');

class UserController {
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status, role_id } = req.query;
      
      const result = await userService.getUsers(
        { search, status, role_id },
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const { error, value } = userSchema.register.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        });
      }

      const user = await userService.createUser(
        value,
        req.ip,
        req.get('user-agent')
      );

      res.status(201).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = userSchema.update.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        });
      }

      const user = await userService.updateUser(
        id,
        value,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await userService.deleteUser(
        id,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async changeUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role_id } = req.body;
      
      const result = await userService.changeUserRole(
        id,
        role_id,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();