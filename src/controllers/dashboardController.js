const analyticsService = require('../services/analyticsService');
const { dashboardSchema } = require('../utils/validators');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const { error, value } = dashboardSchema.summary.validate(req.query);
      if (error) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        });
      }

      const isAdmin = req.userRole === 'admin';
      const summary = await analyticsService.getDashboardSummary(
        req.userId,
        value.start_date,
        value.end_date,
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBreakdown(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      const isAdmin = req.userRole === 'admin';
      
      const breakdown = await analyticsService.getCategoryBreakdown(
        req.userId,
        start_date,
        end_date,
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        data: { breakdown },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyTrends(req, res, next) {
    try {
      const { months = 6 } = req.query;
      const isAdmin = req.userRole === 'admin';
      
      const trends = await analyticsService.getMonthlyTrends(
        req.userId,
        parseInt(months),
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        data: { trends },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivity(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const isAdmin = req.userRole === 'admin';
      
      const activity = await analyticsService.getRecentActivity(
        req.userId,
        parseInt(limit),
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        data: { activity },
      });
    } catch (error) {
      next(error);
    }
  }

  async getInsights(req, res, next) {
    try {
      const isAdmin = req.userRole === 'admin';
      const insights = await analyticsService.getInsights(req.userId, isAdmin);

      res.status(200).json({
        status: 'success',
        data: { insights },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();