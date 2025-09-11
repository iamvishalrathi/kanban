const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        errors
      });
    }

    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { 
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  // User schemas
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(255).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    avatar: Joi.string().uri()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(255).required()
  }),

  // Board schemas
  createBoard: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000),
    backgroundColor: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    visibility: Joi.string().valid('private', 'team', 'public').default('private'),
    settings: Joi.object({
      allowComments: Joi.boolean(),
      requireAssignee: Joi.boolean(),
      autoArchive: Joi.boolean()
    })
  }),

  updateBoard: Joi.object({
    title: Joi.string().min(1).max(100),
    description: Joi.string().max(1000),
    backgroundColor: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    visibility: Joi.string().valid('private', 'team', 'public'),
    settings: Joi.object({
      allowComments: Joi.boolean(),
      requireAssignee: Joi.boolean(),
      autoArchive: Joi.boolean()
    })
  }),

  // Column schemas
  createColumn: Joi.object({
    title: Joi.string().min(1).max(50).required(),
    position: Joi.number().integer().min(0),
    color: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    wipLimit: Joi.number().integer().min(1),
    boardId: Joi.string().uuid().required()
  }),

  updateColumn: Joi.object({
    title: Joi.string().min(1).max(50),
    position: Joi.number().integer().min(0),
    color: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    wipLimit: Joi.number().integer().min(1),
    isCollapsed: Joi.boolean()
  }),

  moveColumn: Joi.object({
    position: Joi.number().integer().min(0).required()
  }),

  // Card schemas
  createCard: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(5000),
    columnId: Joi.string().uuid().required(),
    position: Joi.number().integer().min(0),
    assigneeId: Joi.string().uuid(),
    dueDate: Joi.date().iso(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    labels: Joi.array().items(Joi.object({
      name: Joi.string().min(1).max(50).required(),
      color: Joi.string().regex(/^#[0-9A-F]{6}$/i).required()
    })),
    estimatedHours: Joi.number().precision(2).min(0),
    checklist: Joi.array().items(Joi.object({
      text: Joi.string().min(1).max(200).required(),
      completed: Joi.boolean().default(false)
    }))
  }),

  updateCard: Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(5000),
    assigneeId: Joi.string().uuid().allow(null),
    dueDate: Joi.date().iso().allow(null),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    labels: Joi.array().items(Joi.object({
      name: Joi.string().min(1).max(50).required(),
      color: Joi.string().regex(/^#[0-9A-F]{6}$/i).required()
    })),
    estimatedHours: Joi.number().precision(2).min(0).allow(null),
    actualHours: Joi.number().precision(2).min(0).allow(null),
    checklist: Joi.array().items(Joi.object({
      text: Joi.string().min(1).max(200).required(),
      completed: Joi.boolean().default(false)
    }))
  }),

  moveCard: Joi.object({
    columnId: Joi.string().uuid().required(),
    position: Joi.number().integer().min(0).required()
  }),

  // Comment schemas
  createComment: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    parentId: Joi.string().uuid()
  }),

  updateComment: Joi.object({
    content: Joi.string().min(1).max(1000).required()
  }),

  // Board member schemas
  inviteMember: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('viewer', 'editor', 'admin').default('viewer')
  }),

  updateMemberRole: Joi.object({
    role: Joi.string().valid('viewer', 'editor', 'admin').required()
  }),

  // Template schemas
  createTemplate: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000),
    isPublic: Joi.boolean().default(false),
    templateData: Joi.object().required()
  }),

  // Notification schemas
  markNotificationRead: Joi.object({
    notificationIds: Joi.array().items(Joi.string().uuid()).min(1).required()
  }),

  // Pagination schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'title', 'position'),
    order: Joi.string().valid('ASC', 'DESC').default('ASC')
  }),

  // UUID parameter
  uuidParam: Joi.object({
    id: Joi.string().uuid().required()
  }),

  boardIdParam: Joi.object({
    boardId: Joi.string().uuid().required()
  }),

  cardIdParam: Joi.object({
    cardId: Joi.string().uuid().required()
  }),

  columnIdParam: Joi.object({
    columnId: Joi.string().uuid().required()
  }),

  commentIdParam: Joi.object({
    commentId: Joi.string().uuid().required()
  })
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas
};
