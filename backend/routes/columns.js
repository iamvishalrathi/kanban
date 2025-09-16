const express = require('express');
const columnController = require('../controllers/columnController');
const { authenticateToken } = require('../middleware/auth');
const { 
  checkColumnAccess,
  requireColumnManagement 
} = require('../middleware/accessControl');
const { validate, validateParams, schemas } = require('../middleware/validation');
const { apiRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

// Get column details
router.get('/:columnId',
  validateParams(schemas.columnIdParam),
  checkColumnAccess('view'),
  columnController.getColumn
);

// Update column
router.put('/:columnId',
  validateParams(schemas.columnIdParam),
  requireColumnManagement(),
  validate(schemas.updateColumn),
  columnController.updateColumn
);

// Delete column
router.delete('/:columnId',
  validateParams(schemas.columnIdParam),
  requireColumnManagement(),
  columnController.deleteColumn
);

// Move column to different position
router.put('/:columnId/move',
  validateParams(schemas.columnIdParam),
  requireColumnManagement(),
  validate(schemas.moveColumn),
  columnController.moveColumn
);

// Get column cards
router.get('/:columnId/cards',
  validateParams(schemas.columnIdParam),
  checkColumnAccess('view'),
  columnController.getColumnCards
);

// Archive/restore column
router.put('/:columnId/archive',
  validateParams(schemas.columnIdParam),
  requireColumnManagement(),
  columnController.archiveColumn
);

router.put('/:columnId/restore',
  validateParams(schemas.columnIdParam),
  requireColumnManagement(),
  columnController.restoreColumn
);

// Duplicate column
router.post('/:columnId/duplicate',
  validateParams(schemas.columnIdParam),
  requireColumnManagement(),
  validate(schemas.duplicateColumn),
  columnController.duplicateColumn
);

module.exports = router;