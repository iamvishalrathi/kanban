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
router.delete('/auth/account', auth, authController.deleteAccount);
router.get('/auth/search-users', auth, authController.searchUsers);

// Board routes
router.get('/boards', auth, boardController.getUserBoards);
router.post('/boards', auth, limiter, validateRequest(createBoardSchema), boardController.createBoard);
router.get('/boards/:boardId', auth, boardAccess(['viewer']), boardController.getBoard);
router.put('/boards/:boardId', auth, boardAccess(['admin', 'owner']), validateRequest(updateBoardSchema), boardController.updateBoard);
router.delete('/boards/:boardId', auth, boardAccess(['owner']), boardController.deleteBoard);
router.post('/boards/:boardId/duplicate', auth, boardAccess(['admin', 'owner']), boardController.duplicateBoard);
router.get('/boards/:boardId/export', auth, boardAccess(['viewer']), boardController.exportBoard);
router.get('/boards/:boardId/stats', auth, boardAccess(['viewer']), boardController.getBoardStats);
router.get('/boards/:boardId/activity', auth, boardAccess(['viewer']), boardController.getBoardActivity);

// Column routes
router.post('/boards/:boardId/columns', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(createColumnSchema), columnController.createColumn);
router.put('/boards/:boardId/columns/:columnId', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(updateColumnSchema), columnController.updateColumn);
router.delete('/boards/:boardId/columns/:columnId', auth, boardAccess(['admin', 'owner']), columnController.deleteColumn);
router.put('/boards/:boardId/columns/reorder', auth, boardAccess(['editor', 'admin', 'owner']), columnController.reorderColumns);

// Card routes
router.post('/boards/:boardId/columns/:columnId/cards', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(createCardSchema), cardController.createCard);
router.get('/boards/:boardId/cards/:cardId', auth, boardAccess(['viewer']), cardController.getCard);
router.put('/boards/:boardId/cards/:cardId', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(updateCardSchema), cardController.updateCard);
router.delete('/boards/:boardId/cards/:cardId', auth, boardAccess(['editor', 'admin', 'owner']), cardController.deleteCard);
router.put('/boards/:boardId/cards/:cardId/move', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(moveCardSchema), cardController.moveCard);
router.put('/boards/:boardId/cards/:cardId/assign', auth, boardAccess(['editor', 'admin', 'owner']), cardController.assignCard);
router.put('/boards/:boardId/cards/:cardId/unassign', auth, boardAccess(['editor', 'admin', 'owner']), cardController.unassignCard);
router.post('/boards/:boardId/cards/:cardId/duplicate', auth, boardAccess(['editor', 'admin', 'owner']), cardController.duplicateCard);
router.get('/boards/:boardId/cards/:cardId/history', auth, boardAccess(['viewer']), cardController.getCardHistory);

// Comment routes
router.post('/boards/:boardId/cards/:cardId/comments', auth, boardAccess(['editor', 'admin', 'owner']), validateRequest(createCommentSchema), commentController.createComment);
router.get('/boards/:boardId/cards/:cardId/comments', auth, boardAccess(['viewer']), commentController.getComments);
router.put('/boards/:boardId/comments/:commentId', auth, boardAccess(['editor', 'admin', 'owner']), commentController.updateComment);
router.delete('/boards/:boardId/comments/:commentId', auth, boardAccess(['editor', 'admin', 'owner']), commentController.deleteComment);

// Member routes
router.get('/boards/:boardId/members', auth, boardAccess(['viewer']), memberController.getMembers);
router.post('/boards/:boardId/members/invite', auth, boardAccess(['admin', 'owner']), validateRequest(inviteMemberSchema), memberController.inviteMember);
router.put('/boards/:boardId/members/:memberId/role', auth, boardAccess(['admin', 'owner']), validateRequest(updateMemberRoleSchema), memberController.updateMemberRole);
router.delete('/boards/:boardId/members/:memberId', auth, boardAccess(['admin', 'owner']), memberController.removeMember);
router.post('/boards/:boardId/leave', auth, boardAccess(['viewer']), memberController.leaveBoard);

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
