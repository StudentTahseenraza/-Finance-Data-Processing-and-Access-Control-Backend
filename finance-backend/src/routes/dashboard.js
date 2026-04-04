const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const { rbacMiddleware } = require('../middleware/rbac');

router.use(authMiddleware);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Summary with income, expenses, net balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_income: { type: number }
 *                 total_expense: { type: number }
 *                 net_balance: { type: number }
 *                 total_transactions: { type: number }
 */
router.get('/summary',
  rbacMiddleware(['canViewDashboard']),
  dashboardController.getSummary
);

/**
 * @swagger
 * /dashboard/categories:
 *   get:
 *     summary: Get category breakdown
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Income and expense by category
 */
router.get('/categories',
  rbacMiddleware(['canViewAnalytics']),
  dashboardController.getCategoryBreakdown
);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Get monthly trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 6 }
 *     responses:
 *       200:
 *         description: Monthly trends data
 */
router.get('/trends',
  rbacMiddleware(['canViewAnalytics']),
  dashboardController.getMonthlyTrends
);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent transactions
 */
router.get('/recent',
  rbacMiddleware(['canViewDashboard']),
  dashboardController.getRecentActivity
);

/**
 * @swagger
 * /dashboard/insights:
 *   get:
 *     summary: Get smart insights
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI-like insights and recommendations
 */
router.get('/insights',
  rbacMiddleware(['canViewAnalytics']),
  dashboardController.getInsights
);

module.exports = router;