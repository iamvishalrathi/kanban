const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

// Template validation schemas
const createTemplateValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Template name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .isIn(['general', 'software', 'marketing', 'hr', 'project-management', 'personal'])
    .withMessage('Invalid category'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const useTemplateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Board title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

// Routes
router.get('/templates', authenticateToken, templateController.getTemplates);
router.get('/templates/categories', authenticateToken, templateController.getCategories);
router.get('/templates/official', authenticateToken, templateController.getOfficialTemplates);
router.get('/templates/:templateId', authenticateToken, templateController.getTemplate);

router.post('/boards/:boardId/templates', authenticateToken, createTemplateValidation, validate, templateController.createTemplate);
router.post('/templates/:templateId/use', authenticateToken, useTemplateValidation, validate, templateController.useTemplate);

router.put('/templates/:templateId', authenticateToken, createTemplateValidation, validate, templateController.updateTemplate);
router.delete('/templates/:templateId', authenticateToken, templateController.deleteTemplate);

module.exports = router;