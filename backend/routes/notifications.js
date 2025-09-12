const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, validateParams, schemas } = require('../middleware/validation');
const notificationController = require('../controllers/notificationController');

// All notification routes require authentication
router.use(authenticateToken);

// Get notifications with pagination and filtering
router.get('/',
  notificationController.getNotifications
);

// Get unread notification count
router.get('/unread-count',
  notificationController.getUnreadCount
);

// Mark all notifications as read
router.put('/read-all',
  notificationController.markAllAsRead
);

// Mark specific notification as read
router.put('/:notificationId/read',
  validateParams(schemas.notificationIdParam),
  notificationController.markAsRead
);

module.exports = router;