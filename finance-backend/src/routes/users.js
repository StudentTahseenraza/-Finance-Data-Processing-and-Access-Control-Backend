const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { rbacMiddleware } = require('../middleware/rbac');

// All user routes require authentication and admin role
router.use(authMiddleware);
router.use(rbacMiddleware(['canManageUsers']));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/role', userController.changeUserRole);

module.exports = router;