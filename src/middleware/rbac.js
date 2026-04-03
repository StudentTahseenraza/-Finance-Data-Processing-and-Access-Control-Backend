const { AuthorizationError } = require('../utils/AppError');
const Role = require('../models/Role');

const rbacMiddleware = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userRole = req.userRole;
      const rolePermissions = Role.PERMISSIONS[userRole.toUpperCase()];

      if (!rolePermissions) {
        throw new AuthorizationError('Invalid role configuration');
      }

      // Check if user has all required permissions
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      const hasPermissions = permissions.every(permission => 
        rolePermissions[permission] === true
      );

      if (!hasPermissions) {
        throw new AuthorizationError(
          `Insufficient permissions. Required: ${permissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const checkOwnership = (model, paramIdField = 'id') => {
  return async (req, res, next) => {
    try {
      // Admin can access any resource
      if (req.userRole === 'admin') {
        return next();
      }

      const resourceId = req.params[paramIdField];
      const resource = await model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Resource not found',
        });
      }

      if (resource.user_id !== req.userId) {
        throw new AuthorizationError('You can only access your own resources');
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { rbacMiddleware, checkOwnership };