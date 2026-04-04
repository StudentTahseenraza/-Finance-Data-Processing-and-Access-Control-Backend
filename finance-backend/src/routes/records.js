const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const authMiddleware = require('../middleware/auth');
const { rbacMiddleware } = require('../middleware/rbac');
const { checkOwnership } = require('../middleware/rbac');
const FinancialRecord = require('../models/FinancialRecord');

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Get all financial records with filters
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *         description: Filter by type
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: Start date filter
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: End date filter
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in description/notes
 *     responses:
 *       200:
 *         description: List of records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/',
  rbacMiddleware(['canViewOwnRecords']),
  recordController.getRecords
);

/**
 * @swagger
 * /records/stats:
 *   get:
 *     summary: Get record statistics
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics including totals, averages
 */
router.get('/stats', 
  rbacMiddleware(['canViewAnalytics', 'canViewDashboard']),
  recordController.getRecordStats
);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialRecord'
 *           examples:
 *             Income Example:
 *               value:
 *                 amount: 5000.00
 *                 type: income
 *                 category: Salary
 *                 date: 2024-04-01
 *                 description: Monthly salary
 *             Expense Example:
 *               value:
 *                 amount: 150.00
 *                 type: expense
 *                 category: Food
 *                 date: 2024-04-02
 *                 description: Grocery shopping
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions (Viewers can't create)
 */
router.post('/',
  rbacMiddleware(['canCreateRecords']),
  recordController.createRecord
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a specific record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 */
router.get('/:id',
  rbacMiddleware(['canViewOwnRecords']),
  checkOwnership(FinancialRecord),
  recordController.getRecord
);

/**
 * @swagger
 * /records/{id}:
 *   put:
 *     summary: Update a record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Record updated
 *       403:
 *         description: Can only update own records
 */
router.put('/:id',
  rbacMiddleware(['canUpdateOwnRecords']),
  checkOwnership(FinancialRecord),
  recordController.updateRecord
);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Delete a record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Record deleted
 *       403:
 *         description: Can only delete own records
 */
router.delete('/:id',
  rbacMiddleware(['canDeleteOwnRecords']),
  checkOwnership(FinancialRecord),
  recordController.deleteRecord
);

module.exports = router;