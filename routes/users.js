const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

// 🔍 تشخيص المشكلة
console.log('=== User Controller Diagnosis ===');
console.log('userController type:', typeof userController);
console.log('userController keys:', Object.keys(userController));
console.log('getUser type:', typeof userController.getUser);
console.log('getUser function:', userController.getUser);

// 👤 المسارات العامة
router.post('/', authenticate, checkRole(['admin']), userController.createUser);
router.get('/', authenticate, checkRole(['admin', 'monitoring', 'approval_supervisor']), userController.getUsers);
router.get('/stats', authenticate, checkRole(['admin', 'monitoring']), userController.getUserStats);

// 🛍️ منتجات المستخدم
router.get('/my-products', authenticate, userController.getMyProducts);

// 🚗 إدارة السائقين
router.patch('/drivers/manage', authenticate, checkRole(['admin', 'approval_supervisor']), userController.manageDrivers);

// 📋 المسارات ذات المعلمات (يجب أن تكون في النهاية)
router.get('/:userId', authenticate, userController.getUser);
router.put('/:userId', authenticate, userController.updateUser);
router.patch('/:userId/approve-profile', authenticate, checkRole(['admin', 'approval_supervisor']), userController.approveProfile);
router.get('/:userId/products', authenticate, checkRole(['admin']), userController.getUserProducts);

module.exports = router;
