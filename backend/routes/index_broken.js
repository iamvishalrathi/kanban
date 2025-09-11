const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const boardController = require('../controllers/boardController');
const columnController = require('../controllers/columnController');
const cardController = require('../controllers/cardController');
const commentController = require('../controllers/commentController');
const notificationController = require('../controllers/notificationController');
const memberController = require('../controllers/memberController');
const adminController = require('../controllers/adminController');

// Import middleware
const auth = require('../middleware/auth');
const boardAccess = require('../middleware/boardAccess');
const adminAuth = require('../middleware/adminAuth');
const validateRequest = require('../middleware/validateRequest');
const { limiter, authLimiter } = require('../middleware/rateLimiter');

// Import validation schemas
const {
  authSchemas,
  boardSchemas,
  columnSchemas,
  cardSchemas,
  commentSchemas,
  memberSchemas,
  userSchemas
} = require('../middleware/validationSchemas');

// Auth routes
router.post('/auth/register', authLimiter, validateRequest(authSchemas.register), authController.register);
router.post('/auth/login', authLimiter, validateRequest(authSchemas.login), authController.login);
router.post('/auth/logout', auth, authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/forgot-password', authLimiter, validateRequest(authSchemas.forgotPassword), authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, validateRequest(authSchemas.resetPassword), authController.resetPassword);
router.get('/auth/profile', auth, authController.getProfile);
router.put('/auth/profile', auth, validateRequest(userSchemas.updateProfile), authController.updateProfile);
router.put('/auth/change-password', auth, validateRequest(authSchemas.changePassword), authController.changePassword);
router.delete('/auth/account', auth, authController.deleteAccount);
router.get('/auth/search-users', auth, authController.searchUsers);

// User routes
router.get('/users/profile', auth, authController.getProfile);
router.put('/users/profile', auth, validateRequest(userSchemas.updateProfile), authController.updateProfile);
router.put('/users/change-password', auth, validateRequest(authSchemas.changePassword), authController.changePassword);
router.delete('/users/account', auth, authController.deleteAccount);

// Board routes
router.get('/boards', auth, boardController.getBoards);
router.post('/boards', auth, limiter, validateRequest(boardSchemas.create), boardController.createBoard);
router.get('/boards/:boardId', auth, boardAccess(['viewer']), validateRequest(boardSchemas.getBoard), boardController.getBoard);
router.put('/boards/:boardId', auth, boardAccess(['admin', 'owner']), validateRequest(boardSchemas.update), boardController.updateBoard);
router.delete('/boards/:boardId', auth, boardAccess(['owner']), boardController.deleteBoard);
router.post('/boards/:boardId/duplicate', auth, boardAccess(['admin', 'owner']), boardController.duplicateBoard);
router.get('/boards/:boardId/export', auth, boardAccess(['viewer']), boardController.exportBoard);
router.get('/boards/:boardId/stats', auth, boardAccess(['viewer']), boardController.getBoardStats);
router.get('/boards/:boardId/activity', auth, boardAccess(['viewer']), boardController.getBoardActivity);

// Column routes
router.post('/boards/:boardId/columns', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(columnSchemas.create), columnController.createColumn);
router.put('/boards/:boardId/columns/:columnId', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(columnSchemas.update), columnController.updateColumn);
router.delete('/boards/:boardId/columns/:columnId', auth, boardAccess(['admin', 'owner']), columnController.deleteColumn);
router.put('/boards/:boardId/columns/reorder', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(columnSchemas.reorder), columnController.reorderColumns);

// Card routes
router.post('/cards', auth, validateRequest(cardSchemas.create), cardController.createCard);
router.get('/cards/:cardId', auth, cardController.getCard);
router.put('/cards/:cardId', auth, validateRequest(cardSchemas.update), cardController.updateCard);
router.delete('/cards/:cardId', auth, cardController.deleteCard);
router.put('/cards/:cardId/move', auth, validateRequest(cardSchemas.move), cardController.moveCard);
router.put('/cards/:cardId/assign', auth, validateRequest(cardSchemas.assign), cardController.assignCard);
router.put('/cards/:cardId/unassign', auth, validateRequest(cardSchemas.assign), cardController.unassignCard);
router.post('/cards/:cardId/duplicate', auth, cardController.duplicateCard);
router.get('/cards/:cardId/history', auth, cardController.getCardHistory);

// Comment routes
router.post('/comments', auth, validateRequest(commentSchemas.create), commentController.createComment);
router.get('/cards/:cardId/comments', auth, commentController.getComments);
router.put('/comments/:commentId', auth, validateRequest(commentSchemas.update), commentController.updateComment);
router.delete('/comments/:commentId', auth, commentController.deleteComment);

// Member routes
router.get('/boards/:boardId/members', auth, boardAccess(['viewer']), memberController.getMembers);
router.post('/boards/:boardId/members/invite', auth, boardAccess(['admin', 'owner']), validateRequest(memberSchemas.invite), memberController.inviteMember);
router.put('/boards/:boardId/members/:memberId/role', auth, boardAccess(['admin', 'owner']), validateRequest(memberSchemas.updateRole), memberController.updateMemberRole);
router.delete('/boards/:boardId/members/:memberId', auth, boardAccess(['admin', 'owner']), memberController.removeMember);

// Notification routes
router.get('/notifications', auth, notificationController.getNotifications);
router.put('/notifications/:notificationId/read', auth, notificationController.markAsRead);
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);
router.delete('/notifications/:notificationId', auth, notificationController.deleteNotification);
router.get('/notifications/unread-count', auth, notificationController.getUnreadCount);

// Admin routes
router.get('/admin/dashboard', auth, adminAuth, adminController.getDashboard);
router.get('/admin/users', auth, adminAuth, adminController.getUsers);
router.put('/admin/users/:userId/ban', auth, adminAuth, adminController.banUser);
router.put('/admin/users/:userId/unban', auth, adminAuth, adminController.unbanUser);
router.get('/admin/boards', auth, adminAuth, adminController.getAllBoards);
router.get('/admin/audit-logs', auth, adminAuth, adminController.getAuditLogs);
router.get('/admin/stats', auth, adminAuth, adminController.getSystemStats);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
