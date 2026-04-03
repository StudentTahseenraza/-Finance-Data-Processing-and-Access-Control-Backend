const { Op } = require('sequelize');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/AppError');
const logger = require('../utils/logger');

class UserService {
  async getUsers(filters = {}, page = 1, limit = 20) {
    const where = {};
    
    if (filters.search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { full_name: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }
    
    if (filters.status) where.status = filters.status;
    if (filters.role_id) where.role_id = filters.role_id;

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      include: ['role'],
      attributes: { exclude: ['password_hash', 'refresh_token'] },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getUserById(userId) {
    const user = await User.findByPk(userId, {
      include: ['role'],
      attributes: { exclude: ['password_hash', 'refresh_token'] },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async createUser(userData, ipAddress, userAgent) {
    // Check if email exists
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Get role
    const role = await Role.findByPk(userData.role_id);
    if (!role) {
      throw new ValidationError('Invalid role');
    }

    const user = await User.create(userData);

    // Log audit
    await AuditLog.create({
      user_id: user.id,
      action: 'CREATE_USER',
      resource_type: 'user',
      resource_id: user.id,
      new_value: user.toJSON(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Return user without sensitive data
    const { password_hash, refresh_token, ...userResponse } = user.toJSON();
    userResponse.role = role;
    
    return userResponse;
  }

  async updateUser(userId, updateData, ipAddress, userAgent) {
    const user = await this.getUserById(userId);
    
    const oldValue = user.toJSON();
    
    // If changing role, validate it exists
    if (updateData.role_id) {
      const role = await Role.findByPk(updateData.role_id);
      if (!role) {
        throw new ValidationError('Invalid role');
      }
    }
    
    await user.update(updateData);
    
    // Log audit
    await AuditLog.create({
      user_id: userId,
      action: 'UPDATE_USER',
      resource_type: 'user',
      resource_id: userId,
      old_value: oldValue,
      new_value: user.toJSON(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    // Return updated user without sensitive data
    const { password_hash, refresh_token, ...userResponse } = user.toJSON();
    return userResponse;
  }

  async deleteUser(userId, ipAddress, userAgent) {
    const user = await this.getUserById(userId);
    
    // Don't allow deleting the last admin
    const adminCount = await User.count({
      where: { role_id: { [Op.ne]: null }, status: 'active' },
      include: [{
        model: Role,
        where: { name: 'admin' },
      }],
    });
    
    const isAdmin = await Role.findOne({
      where: { id: user.role_id, name: 'admin' },
    });
    
    if (isAdmin && adminCount <= 1) {
      throw new ValidationError('Cannot delete the last admin user');
    }
    
    // Soft delete
    await user.update({ status: 'inactive' });
    
    // Log audit
    await AuditLog.create({
      user_id: userId,
      action: 'DELETE_USER',
      resource_type: 'user',
      resource_id: userId,
      old_value: user.toJSON(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    return { success: true, message: 'User deactivated successfully' };
  }

  async changeUserRole(userId, roleId, ipAddress, userAgent) {
    const user = await this.getUserById(userId);
    const role = await Role.findByPk(roleId);
    
    if (!role) {
      throw new ValidationError('Invalid role');
    }
    
    const oldValue = user.toJSON();
    await user.update({ role_id: roleId });
    
    // Log audit
    await AuditLog.create({
      user_id: userId,
      action: 'CHANGE_ROLE',
      resource_type: 'user',
      resource_id: userId,
      old_value: { role_id: oldValue.role_id },
      new_value: { role_id: roleId },
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    return { success: true, message: 'User role updated successfully' };
  }
}

module.exports = new UserService();