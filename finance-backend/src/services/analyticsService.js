const { Op, Sequelize } = require('sequelize');
const FinancialRecord = require('../models/FinancialRecord');
const redisClient = require('../config/redis');
const moment = require('moment');

class AnalyticsService {
  async getDashboardSummary(userId, startDate, endDate, isAdmin = false) {
    const cacheKey = `dashboard:summary:${userId}:${startDate}:${endDate}`;
    
    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) return cached;

    const where = {};
    if (!isAdmin) where.user_id = userId;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const summary = await FinancialRecord.findAll({
      where,
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN type = 'income' THEN amount ELSE 0 END`)), 'total_income'],
        [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN type = 'expense' THEN amount ELSE 0 END`)), 'total_expense'],
        [Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN type = 'income' THEN 1 END`)), 'income_count'],
        [Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN type = 'expense' THEN 1 END`)), 'expense_count'],
      ],
    });

    const result = summary[0].toJSON();
    result.net_balance = (result.total_income || 0) - (result.total_expense || 0);
    result.total_transactions = (result.income_count || 0) + (result.expense_count || 0);

    // Cache for 5 minutes
    await redisClient.set(cacheKey, result, 300);
    
    return result;
  }

  async getCategoryBreakdown(userId, startDate, endDate, isAdmin = false) {
    const cacheKey = `dashboard:categories:${userId}:${startDate}:${endDate}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return cached;

    const where = {};
    if (!isAdmin) where.user_id = userId;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const breakdown = await FinancialRecord.findAll({
      where,
      attributes: [
        'category',
        'type',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_amount'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      group: ['category', 'type'],
      order: [[Sequelize.literal('total_amount'), 'DESC']],
    });

    const result = {
      income: breakdown.filter(b => b.type === 'income'),
      expense: breakdown.filter(b => b.type === 'expense'),
    };

    await redisClient.set(cacheKey, result, 300);
    
    return result;
  }

  async getMonthlyTrends(userId, months = 6, isAdmin = false) {
    const cacheKey = `dashboard:trends:${userId}:${months}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return cached;

    const startDate = moment().subtract(months, 'months').startOf('month').format('YYYY-MM-DD');
    
    const where = {};
    if (!isAdmin) where.user_id = userId;
    where.date = { [Op.gte]: startDate };

    const trends = await FinancialRecord.findAll({
      where,
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('date')), 'month'],
        [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN type = 'income' THEN amount ELSE 0 END`)), 'total_income'],
        [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN type = 'expense' THEN amount ELSE 0 END`)), 'total_expense'],
        [Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN type = 'income' THEN 1 END`)), 'income_count'],
        [Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN type = 'expense' THEN 1 END`)), 'expense_count'],
      ],
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('date'))],
      order: [[Sequelize.literal('month'), 'ASC']],
    });

    const result = trends.map(t => ({
      month: moment(t.get('month')).format('YYYY-MM'),
      income: parseFloat(t.get('total_income') || 0),
      expense: parseFloat(t.get('total_expense') || 0),
      net: parseFloat((t.get('total_income') || 0) - (t.get('total_expense') || 0)),
      income_count: parseInt(t.get('income_count') || 0),
      expense_count: parseInt(t.get('expense_count') || 0),
    }));

    await redisClient.set(cacheKey, result, 600);
    
    return result;
  }

  async getRecentActivity(userId, limit = 10, isAdmin = false) {
    const where = {};
    if (!isAdmin) where.user_id = userId;

    const recent = await FinancialRecord.findAll({
      where,
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      limit,
      attributes: ['id', 'amount', 'type', 'category', 'date', 'description'],
    });

    return recent;
  }

  async getInsights(userId, isAdmin = false) {
    const cacheKey = `dashboard:insights:${userId}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return cached;

    const where = {};
    if (!isAdmin) where.user_id = userId;

    // Get top spending categories
    const topSpending = await FinancialRecord.findAll({
      where: { ...where, type: 'expense' },
      attributes: [
        'category',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
      ],
      group: ['category'],
      order: [[Sequelize.literal('total'), 'DESC']],
      limit: 5,
    });

    // Get highest income sources
    const topIncome = await FinancialRecord.findAll({
      where: { ...where, type: 'income' },
      attributes: [
        'category',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
      ],
      group: ['category'],
      order: [[Sequelize.literal('total'), 'DESC']],
      limit: 5,
    });

    // Calculate average daily spending
    const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const recentSpending = await FinancialRecord.findAll({
      where: {
        ...where,
        type: 'expense',
        date: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
      ],
    });

    const dailyAverage = (recentSpending[0]?.get('total') || 0) / 30;

    const insights = {
      top_spending_categories: topSpending.map(c => ({
        category: c.category,
        total: parseFloat(c.get('total')),
      })),
      top_income_sources: topIncome.map(c => ({
        category: c.category,
        total: parseFloat(c.get('total')),
      })),
      average_daily_spending: parseFloat(dailyAverage),
    };

    await redisClient.set(cacheKey, insights, 1800); // Cache for 30 minutes
    
    return insights;
  }
}

module.exports = new AnalyticsService();