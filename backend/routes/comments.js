const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const { 
  checkCommentAccess,
  checkCardAccess,
  requireCommentOwnership 
} = require('../middleware/accessControl');
const { validate, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { apiRateLimit, commentCreationLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

// Get all comments for a card (handled in cards routes)
// POST /cards/:cardId/comments - create comment
// GET /cards/:cardId/comments - get comments

// Get single comment
router.get('/:commentId',
  validateParams(schemas.commentIdParam),
  checkCommentAccess('view'),
  commentController.getComment
);

// Update comment
router.put('/:commentId',
  validateParams(schemas.commentIdParam),
  requireCommentOwnership(),
  validate(schemas.updateComment),
  commentController.updateComment
);

// Delete comment
router.delete('/:commentId',
  validateParams(schemas.commentIdParam),
  requireCommentOwnership(),
  commentController.deleteComment
);

// Reply to comment
router.post('/:commentId/replies',
  validateParams(schemas.commentIdParam),
  checkCommentAccess('reply'),
  commentCreationLimit,
  validate(schemas.createReply),
  commentController.createReply
);

// Get comment replies
router.get('/:commentId/replies',
  validateParams(schemas.commentIdParam),
  checkCommentAccess('view'),
  validateQuery(schemas.pagination),
  commentController.getReplies
);

// React to comment (like/dislike)
router.post('/:commentId/reactions',
  validateParams(schemas.commentIdParam),
  checkCommentAccess('react'),
  validate(schemas.createReaction),
  commentController.addReaction
);

// Remove reaction from comment
router.delete('/:commentId/reactions/:reactionType',
  validateParams(schemas.commentIdParam),
  checkCommentAccess('react'),
  commentController.removeReaction
);

// Get comment history/edits
router.get('/:commentId/history',
  validateParams(schemas.commentIdParam),
  checkCommentAccess('view'),
  commentController.getCommentHistory
);

// Mark comment as resolved (for discussions)
router.put('/:commentId/resolve',
  validateParams(schemas.commentIdParam),
  checkCardAccess('edit'),
  commentController.resolveComment
);

// Unresolve comment
router.put('/:commentId/unresolve',
  validateParams(schemas.commentIdParam),
  checkCardAccess('edit'),
  commentController.unresolveComment
);

module.exports = router;