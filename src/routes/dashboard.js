const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const { rbacMiddleware } = require('../middleware/rbac');

router.use(authMiddleware);

// All dashboard routes require at least viewer permissions
router.get('/summary',
  rbacMiddleware(['canViewDashboard']),
  dashboardController.getSummary
);

router.get('/categories',
  rbacMiddleware(['canViewAnalytics']),
  dashboardController.getCategoryBreakdown
);

router.get('/trends',
  rbacMiddleware(['canViewAnalytics']),
  dashboardController.getMonthlyTrends
);

router.get('/recent',
  rbacMiddleware(['canViewDashboard']),
  dashboardController.getRecentActivity
);

router.get('/insights',
  rbacMiddleware(['canViewAnalytics']),
  dashboardController.getInsights
);

module.exports = router;