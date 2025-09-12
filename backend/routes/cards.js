const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, validateParams, schemas } = require('../middleware/validation');
const cardController = require('../controllers/cardController');
const commentController = require('../controllers/commentController');
const { checkCardAccess } = require('../middleware/accessControl');

// All card routes require authentication
router.use(authenticateToken);

// Get single card
router.get('/:cardId',
  validateParams(schemas.cardIdParam),
  checkCardAccess('view'),
  cardController.getCard
);

// Update card
router.put('/:cardId',
  validateParams(schemas.cardIdParam),
  checkCardAccess('edit'),
  validate(schemas.updateCard),
  cardController.updateCard
);

// Delete card
router.delete('/:cardId',
  validateParams(schemas.cardIdParam),
  checkCardAccess('delete'),
  cardController.deleteCard
);

// Move card to different column/position
router.put('/:cardId/move',
  validateParams(schemas.cardIdParam),
  checkCardAccess('edit'),
  validate(schemas.moveCard),
  cardController.moveCard
);

// Card comments routes
router.get('/:cardId/comments',
  validateParams(schemas.cardIdParam),
  checkCardAccess('view'),
  commentController.getComments
);

router.post('/:cardId/comments',
  validateParams(schemas.cardIdParam),
  checkCardAccess('view'),
  validate(schemas.createComment),
  commentController.createComment
);

// Create card (direct creation without boardId in URL)
router.post('/',
  validate(schemas.createCard),
  cardController.createDirectCard
);

module.exports = router;