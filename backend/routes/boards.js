const express = require('express');
const boardController = require('../controllers/boardController');
const { authenticateToken } = require('../middleware/auth');
const { checkBoardAccess, requireBoardEdit, requireBoardAdmin } = require('../middleware/boardAccess');
const { validate, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { apiRateLimit, boardCreationLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

// Get all boards for user
router.get('/',
  validateQuery(schemas.pagination),
  boardController.getBoards
);

// Create new board
router.post('/',
  boardCreationLimit,
  validate(schemas.createBoard),
  boardController.createBoard
);

// Get single board
router.get('/:boardId',
  validateParams(schemas.boardIdParam),
  checkBoardAccess(),
  boardController.getBoard
);

// Update board
router.put('/:boardId',
  validateParams(schemas.boardIdParam),
  requireBoardEdit,
  validate(schemas.updateBoard),
  boardController.updateBoard
);

// Delete board
router.delete('/:boardId',
  validateParams(schemas.boardIdParam),
  checkBoardAccess(),
  boardController.deleteBoard
);

// Archive/Unarchive board
router.patch('/:boardId/archive',
  validateParams(schemas.boardIdParam),
  requireBoardAdmin,
  boardController.toggleArchiveBoard
);

// Duplicate board
router.post('/:boardId/duplicate',
  validateParams(schemas.boardIdParam),
  checkBoardAccess(),
  boardController.duplicateBoard
);

// Export board
router.get('/:boardId/export',
  validateParams(schemas.boardIdParam),
  checkBoardAccess(),
  boardController.exportBoard
);

// Get board statistics
router.get('/:boardId/stats',
  validateParams(schemas.boardIdParam),
  checkBoardAccess(),
  boardController.getBoardStats
);

module.exports = router;
