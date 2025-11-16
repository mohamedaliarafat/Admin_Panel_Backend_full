// routes/orders.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const {
  createFuelOrder,
  createProductOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  setOrderPrice,
  assignDriver,
  updateOrderTracking
} = require('../controllers/orderController');

const router = express.Router();

// 📊 إحصائيات الطلبات
router.get(
  '/stats',
  authMiddleware.authenticate,
  roleMiddleware.checkRole(['admin', 'monitoring']),
  (req, res) => {
    res.json({
      success: true,
      message: 'Order statistics - under development',
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        ordersByType: [],
        recentOrders: []
      }
    });
  }
);

// 🛢️ طلبات الوقود (مقدمة على المسارات الديناميكية)
router.post('/fuel', authMiddleware.authenticate, createFuelOrder);
router.get('/fuel/:orderId', authMiddleware.authenticate, getOrder);

// 🛍️ طلبات المنتجات
router.post('/product', authMiddleware.authenticate, createProductOrder);
router.get('/product/:orderId', authMiddleware.authenticate, getOrder);

// 📦 الطلبات العامة
router.post('/', authMiddleware.authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Order creation - under development',
    order: req.body
  });
});

router.get('/', authMiddleware.authenticate, getOrders);
router.get('/:orderId', authMiddleware.authenticate, getOrder);

// 👨‍💼 إدارة الطلبات (تغيير الحالة / السعر / السائق)
router.patch(
  '/:orderId/status',
  authMiddleware.authenticate,
  roleMiddleware.checkRole(['approval_supervisor', 'admin', 'monitoring']),
  updateOrderStatus
);

router.patch(
  '/:orderId/price',
  authMiddleware.authenticate,
  roleMiddleware.checkRole(['admin']),
  setOrderPrice
);

router.patch(
  '/:orderId/assign-driver',
  authMiddleware.authenticate,
  roleMiddleware.checkRole(['admin', 'approval_supervisor']),
  assignDriver
);

// 🚗 تتبع الطلبات (للسائقين)
router.patch(
  '/:orderId/tracking',
  authMiddleware.authenticate,
  roleMiddleware.checkRole(['driver']),
  updateOrderTracking
);

module.exports = router;
