const express = require('express');
const boardController = require('../controllers/boardController');
const { authenticateToken } = require('../middleware/auth');
const { 
  checkBoardAccess, 
  requireBoardOwner, 
  requireSettingsManagement 
} = require('../middleware/accessControl');
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
  checkBoardAccess('view_board'),
  boardController.getBoard
);

// Update board
router.put('/:boardId',
  validateParams(schemas.boardIdParam),
  requireSettingsManagement(),
  validate(schemas.updateBoard),
  boardController.updateBoard
);

// Delete board
router.delete('/:boardId',
  validateParams(schemas.boardIdParam),
  requireBoardOwner(),
  boardController.deleteBoard
);

// Archive/Unarchive board
router.patch('/:boardId/archive',
  validateParams(schemas.boardIdParam),
  requireSettingsManagement(),
  boardController.toggleArchiveBoard
);

// Duplicate board
router.post('/:boardId/duplicate',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('view_board'),
  boardController.duplicateBoard
);

// Export board
router.get('/:boardId/export',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('view_board'),
  boardController.exportBoard
);

// Get board statistics
router.get('/:boardId/stats',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('view_board'),
  boardController.getBoardStats
);

// Import controllers for nested routes
const columnController = require('../controllers/columnController');
const cardController = require('../controllers/cardController');
const { checkCardAccess } = require('../middleware/accessControl');

// Column routes
router.get('/:boardId/columns',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('view_board'),
  columnController.getColumns
);

router.post('/:boardId/columns',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('edit_cards'),
  validate(schemas.createColumn),
  columnController.createColumn
);

router.put('/:boardId/columns/:columnId',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('edit_cards'),
  validate(schemas.updateColumn),
  columnController.updateColumn
);

router.delete('/:boardId/columns/:columnId',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('delete_cards'),
  columnController.deleteColumn
);

// Card routes
router.get('/:boardId/cards',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('view_board'),
  cardController.getCards
);

router.post('/:boardId/columns/:columnId/cards',
  validateParams(schemas.boardIdParam),
  checkBoardAccess('edit_cards'),
  validate(schemas.createCard),
  cardController.createCard
);

router.get('/:boardId/cards/:cardId',
  validateParams(schemas.boardIdParam),
  checkCardAccess('view'),
  cardController.getCard
);

router.put('/:boardId/cards/:cardId',
  validateParams(schemas.boardIdParam),
  checkCardAccess('edit'),
  validate(schemas.updateCard),
  cardController.updateCard
);

router.delete('/:boardId/cards/:cardId',
  validateParams(schemas.boardIdParam),
  checkCardAccess('delete'),
  cardController.deleteCard
);

module.exports = router;
