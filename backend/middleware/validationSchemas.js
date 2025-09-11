const { body, param, query } = require('express-validator');

// Auth validation schemas
const authSchemas = {
  register: [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
  ]
};

// Board validation schemas
const boardSchemas = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Board title is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Board title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean')
  ],
  update: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Board title cannot be empty')
      .isLength({ min: 1, max: 100 })
      .withMessage('Board title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean')
  ],
  getBoard: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID')
  ]
};

// Column validation schemas
const columnSchemas = {
  create: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Column title is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Column title must be between 1 and 100 characters'),
    body('position')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Position must be a non-negative integer')
  ],
  update: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    param('columnId')
      .isUUID()
      .withMessage('Invalid column ID'),
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Column title cannot be empty')
      .isLength({ min: 1, max: 100 })
      .withMessage('Column title must be between 1 and 100 characters'),
    body('position')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Position must be a non-negative integer')
  ],
  reorder: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    body('columnOrders')
      .isArray()
      .withMessage('Column orders must be an array'),
    body('columnOrders.*.id')
      .isUUID()
      .withMessage('Invalid column ID'),
    body('columnOrders.*.position')
      .isInt({ min: 0 })
      .withMessage('Position must be a non-negative integer')
  ]
};

// Card validation schemas
const cardSchemas = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Card title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Card title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('columnId')
      .isUUID()
      .withMessage('Invalid column ID'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('position')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Position must be a non-negative integer')
  ],
  update: [
    param('cardId')
      .isUUID()
      .withMessage('Invalid card ID'),
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Card title cannot be empty')
      .isLength({ min: 1, max: 200 })
      .withMessage('Card title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high')
  ],
  move: [
    param('cardId')
      .isUUID()
      .withMessage('Invalid card ID'),
    body('columnId')
      .isUUID()
      .withMessage('Invalid column ID'),
    body('position')
      .isInt({ min: 0 })
      .withMessage('Position must be a non-negative integer')
  ],
  assign: [
    param('cardId')
      .isUUID()
      .withMessage('Invalid card ID'),
    body('userId')
      .isUUID()
      .withMessage('Invalid user ID')
  ]
};

// Comment validation schemas
const commentSchemas = {
  create: [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
    body('cardId')
      .isUUID()
      .withMessage('Invalid card ID')
  ],
  update: [
    param('commentId')
      .isUUID()
      .withMessage('Invalid comment ID'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters')
  ]
};

// Member validation schemas
const memberSchemas = {
  invite: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('role')
      .optional()
      .isIn(['viewer', 'editor', 'admin'])
      .withMessage('Role must be viewer, editor, or admin')
  ],
  updateRole: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    param('memberId')
      .isUUID()
      .withMessage('Invalid member ID'),
    body('role')
      .isIn(['viewer', 'editor', 'admin'])
      .withMessage('Role must be viewer, editor, or admin')
  ]
};

// User validation schemas
const userSchemas = {
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters')
  ]
};

// Label validation schemas
const labelSchemas = {
  create: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Label name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Label name must be between 1 and 50 characters'),
    body('color')
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color')
  ],
  update: [
    param('boardId')
      .isUUID()
      .withMessage('Invalid board ID'),
    param('labelId')
      .isUUID()
      .withMessage('Invalid label ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Label name cannot be empty')
      .isLength({ min: 1, max: 50 })
      .withMessage('Label name must be between 1 and 50 characters'),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color')
  ]
};

// Query validation schemas
const querySchemas = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'title', 'name'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC')
  ],
  search: [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters')
  ]
};

module.exports = {
  authSchemas,
  boardSchemas,
  columnSchemas,
  cardSchemas,
  commentSchemas,
  memberSchemas,
  userSchemas,
  labelSchemas,
  querySchemas
};
