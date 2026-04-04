const { Op } = require('sequelize');
const FinancialRecord = require('../models/FinancialRecord');
const AuditLog = require('../models/AuditLog');
const { NotFoundError, ValidationError } = require('../utils/AppError');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class RecordService {
  async createRecord(userId, recordData, ipAddress, userAgent) {
    const record = await FinancialRecord.create({
      ...recordData,
      user_id: userId,
    });

    // Invalidate cache
    await redisClient.clearPattern(`dashboard:${userId}:*`);
    await redisClient.clearPattern(`records:${userId}:*`);

    // Log audit
    await AuditLog.create({
      user_id: userId,
      action: 'CREATE',
      resource_type: 'financial_record',
      resource_id: record.id,
      new_value: record.toJSON(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return record;
  }

  async getRecords(userId, filters, isAdmin = false) {
    const {
      start_date,
      end_date,
      type,
      category,
      min_amount,
      max_amount,
      search,
      page = 1,
      limit = 20,
      sort_by = 'date',
      sort_order = 'DESC',
    } = filters;

    // Build where clause
    const where = {};
    
    if (!isAdmin) {
      where.user_id = userId;
    }

    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date[Op.gte] = start_date;
      if (end_date) where.date[Op.lte] = end_date;
    }

    if (type) where.type = type;
    if (category) where.category = category;

    if (min_amount || max_amount) {
      where.amount = {};
      if (min_amount) where.amount[Op.gte] = min_amount;
      if (max_amount) where.amount[Op.lte] = max_amount;
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get records
    const { count, rows } = await FinancialRecord.findAndCountAll({
      where,
      order: [[sort_by, sort_order]],
      limit,
      offset,
      attributes: { exclude: ['deleted_at'] },
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

  async getRecordById(userId, recordId, isAdmin = false) {
    const where = { id: recordId };
    if (!isAdmin) where.user_id = userId;

    const record = await FinancialRecord.findOne({ where });

    if (!record) {
      throw new NotFoundError('Financial record');
    }

    return record;
  }

  async updateRecord(userId, recordId, updateData, ipAddress, userAgent, isAdmin = false) {
    const record = await this.getRecordById(userId, recordId, isAdmin);

    const oldValue = record.toJSON();
    await record.update(updateData);

    // Invalidate cache
    await redisClient.clearPattern(`dashboard:${userId}:*`);
    await redisClient.clearPattern(`records:${userId}:*`);

    // Log audit
    await AuditLog.create({
      user_id: userId,
      action: 'UPDATE',
      resource_type: 'financial_record',
      resource_id: recordId,
      old_value: oldValue,
      new_value: record.toJSON(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return record;
  }

  async deleteRecord(userId, recordId, ipAddress, userAgent, isAdmin = false) {
    const record = await this.getRecordById(userId, recordId, isAdmin);

    const oldValue = record.toJSON();
    await record.destroy(); // Soft delete due to paranoid: true

    // Invalidate cache
    await redisClient.clearPattern(`dashboard:${userId}:*`);
    await redisClient.clearPattern(`records:${userId}:*`);

    // Log audit
    await AuditLog.create({
      user_id: userId,
      action: 'DELETE',
      resource_type: 'financial_record',
      resource_id: recordId,
      old_value: oldValue,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return { success: true, message: 'Record deleted successfully' };
  }

  async getRecordStats(userId, isAdmin = false) {
    const where = {};
    if (!isAdmin) where.user_id = userId;

    const stats = await FinancialRecord.findAll({
      where,
      attributes: [
        [FinancialRecord.sequelize.fn('COUNT', FinancialRecord.sequelize.col('id')), 'total'],
        [FinancialRecord.sequelize.fn('SUM', 
          FinancialRecord.sequelize.literal(`CASE WHEN type = 'income' THEN amount ELSE 0 END`)), 'total_income'],
        [FinancialRecord.sequelize.fn('SUM', 
          FinancialRecord.sequelize.literal(`CASE WHEN type = 'expense' THEN amount ELSE 0 END`)), 'total_expense'],
        [FinancialRecord.sequelize.fn('AVG', FinancialRecord.sequelize.col('amount')), 'average_amount'],
      ],
    });

    const result = stats[0].toJSON();
    result.net_balance = (result.total_income || 0) - (result.total_expense || 0);
    
    return result;
  }
}

module.exports = new RecordService();