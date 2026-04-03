const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const authMiddleware = require('../middleware/auth');
const { rbacMiddleware } = require('../middleware/rbac');
const { checkOwnership } = require('../middleware/rbac');
const FinancialRecord = require('../models/FinancialRecord');

// All routes require authentication
router.use(authMiddleware);

// Routes with specific permissions
router.get('/stats', 
  rbacMiddleware(['canViewAnalytics', 'canViewDashboard']),
  recordController.getRecordStats
);

router.get('/',
  rbacMiddleware(['canViewOwnRecords']),
  recordController.getRecords
);

router.post('/',
  rbacMiddleware(['canCreateRecords']),
  recordController.createRecord
);

router.get('/:id',
  rbacMiddleware(['canViewOwnRecords']),
  checkOwnership(FinancialRecord),
  recordController.getRecord
);

router.put('/:id',
  rbacMiddleware(['canUpdateOwnRecords']),
  checkOwnership(FinancialRecord),
  recordController.updateRecord
);

router.delete('/:id',
  rbacMiddleware(['canDeleteOwnRecords']),
  checkOwnership(FinancialRecord),
  recordController.deleteRecord
);

module.exports = router;