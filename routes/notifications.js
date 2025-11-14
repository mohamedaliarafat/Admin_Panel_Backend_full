const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');
const Notification = require('../models/Notification');

// ⭐ دالة لجلب إحصائيات الإشعارات حسب النوع
async function getNotificationsByType() {
  try {
    return await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
  } catch (error) {
    throw new Error(`فشل في جلب الإحصائيات حسب النوع: ${error.message}`);
  }
}

// ⭐ دالة لجلب إحصائيات الإشعارات حسب الأولوية
async function getNotificationsByPriority() {
  try {
    return await Notification.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
  } catch (error) {
    throw new Error(`فشل في جلب الإحصائيات حسب الأولوية: ${error.message}`);
  }
}

// ⭐ دالة لجلب الإحصائيات الشاملة للمدراء
async function getAdminStats(req, res) {
  try {
    const totalNotifications = await Notification.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayNotifications = await Notification.countDocuments({
      createdAt: { $gte: today }
    });

    const broadcastCount = await Notification.countDocuments({ broadcast: true });
    const scheduledCount = await Notification.countDocuments({ isScheduled: true });

    const byType = await getNotificationsByType();
    const byPriority = await getNotificationsByPriority();

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        today: todayNotifications,
        broadcast: broadcastCount,
        scheduled: scheduledCount,
        byType: byType,
        byPriority: byPriority
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الإحصائيات',
      error: error.message
    });
  }
}

// ⭐ Routes للمستخدمين العاديين
router.get('/my-notifications', authenticate, notificationController.getUserNotifications);
router.get('/stats', authenticate, notificationController.getNotificationStats);
router.patch('/:notificationId/read', authenticate, notificationController.markAsRead);
router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead);

// ⭐ Routes للمدراء فقط
router.post('/', authenticate, checkRole(['admin', 'monitoring']), notificationController.createNotification);
router.post('/send-to-user', authenticate, checkRole(['admin', 'monitoring']), notificationController.sendToUser);
router.post('/send-to-group', authenticate, checkRole(['admin', 'monitoring']), notificationController.sendToGroup);
router.delete('/:notificationId', authenticate, checkRole(['admin', 'monitoring']), notificationController.deleteNotification);

// ⭐ Routes إضافية للمدراء
router.get('/admin/stats', authenticate, checkRole(['admin', 'monitoring']), getAdminStats);

module.exports = router;
