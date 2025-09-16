const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { 
  requireSelfOrAdmin,
  requireAdminRole 
} = require('../middleware/accessControl');
const { validate, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { apiRateLimit, uploadRateLimit } = require('../middleware/rateLimit');
const { uploadProfilePicture } = require('../middleware/upload');

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

// Get current user profile
router.get('/me',
  userController.getCurrentUser
);

// Update current user profile
router.put('/me',
  validate(schemas.updateProfile),
  userController.updateCurrentUser
);

// Change password
router.put('/me/password',
  validate(schemas.changePassword),
  userController.changePassword
);

// Upload profile picture
router.post('/me/avatar',
  uploadRateLimit,
  uploadProfilePicture.single('avatar'),
  userController.uploadAvatar
);

// Delete profile picture
router.delete('/me/avatar',
  userController.deleteAvatar
);

// Get user preferences
router.get('/me/preferences',
  userController.getUserPreferences
);

// Update user preferences
router.put('/me/preferences',
  validate(schemas.updatePreferences),
  userController.updateUserPreferences
);

// Get user activity/history
router.get('/me/activity',
  validateQuery(schemas.pagination),
  userController.getUserActivity
);

// Get user notifications settings
router.get('/me/notification-settings',
  userController.getNotificationSettings
);

// Update notification settings
router.put('/me/notification-settings',
  validate(schemas.updateNotificationSettings),
  userController.updateNotificationSettings
);

// Get user's boards summary
router.get('/me/boards/summary',
  validateQuery(schemas.boardsQuery),
  userController.getUserBoardsSummary
);

// Get user statistics
router.get('/me/stats',
  validateQuery(schemas.dateRange),
  userController.getUserStats
);

// Delete user account
router.delete('/me',
  validate(schemas.deleteAccount),
  userController.deleteAccount
);

// Export user data
router.get('/me/export',
  userController.exportUserData
);

// Admin routes for user management
router.get('/',
  requireAdminRole(),
  validateQuery(schemas.usersQuery),
  userController.getAllUsers
);

// Get specific user (admin only)
router.get('/:userId',
  validateParams(schemas.userIdParam),
  requireAdminRole(),
  userController.getUser
);

// Update user (admin only)
router.put('/:userId',
  validateParams(schemas.userIdParam),
  requireAdminRole(),
  validate(schemas.adminUpdateUser),
  userController.updateUser
);

// Ban user (admin only)
router.put('/:userId/ban',
  validateParams(schemas.userIdParam),
  requireAdminRole(),
  validate(schemas.banUser),
  userController.banUser
);

// Unban user (admin only)
router.put('/:userId/unban',
  validateParams(schemas.userIdParam),
  requireAdminRole(),
  userController.unbanUser
);

// Delete user (admin only)
router.delete('/:userId',
  validateParams(schemas.userIdParam),
  requireAdminRole(),
  userController.deleteUser
);

// Get user activity (admin only)
router.get('/:userId/activity',
  validateParams(schemas.userIdParam),
  requireAdminRole(),
  validateQuery(schemas.pagination),
  userController.getUserActivityAdmin
);

module.exports = router;