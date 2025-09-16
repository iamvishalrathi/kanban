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

      console.log('Validation error details:', {
        route: req.route?.path || req.path,
        method: req.method,
        body: req.body,
        errors: errors
      });

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
    username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).optional(),
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
    username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/),
    bio: Joi.string().max(500).allow(''),
    timezone: Joi.string().max(50),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko').default('en')
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(255).required()
  }),

  updatePreferences: Joi.object({
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').default('light'),
      boardView: Joi.string().valid('kanban', 'list', 'calendar').default('kanban'),
      emailDigest: Joi.boolean().default(true),
      compactMode: Joi.boolean().default(false),
      showCompletedCards: Joi.boolean().default(false)
    }),
    timezone: Joi.string().max(50),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'),
    theme: Joi.string().valid('light', 'dark', 'auto')
  }),

  updateNotificationSettings: Joi.object({
    settings: Joi.object({
      email: Joi.object({
        cardAssigned: Joi.boolean(),
        cardDue: Joi.boolean(),
        boardInvite: Joi.boolean(),
        comments: Joi.boolean(),
        updates: Joi.boolean()
      }),
      push: Joi.object({
        cardAssigned: Joi.boolean(),
        cardDue: Joi.boolean(),
        boardInvite: Joi.boolean(),
        comments: Joi.boolean(),
        updates: Joi.boolean()
      }),
      inApp: Joi.object({
        cardAssigned: Joi.boolean(),
        cardDue: Joi.boolean(),
        boardInvite: Joi.boolean(),
        comments: Joi.boolean(),
        updates: Joi.boolean()
      })
    }).required()
  }),

  deleteAccount: Joi.object({
    password: Joi.string().required(),
    confirmation: Joi.string().valid('DELETE_MY_ACCOUNT').required()
  }),

  // Board schemas
  createBoard: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).allow(''),
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

  reorderColumns: Joi.object({
    columnIds: Joi.array().items(Joi.string().uuid()).min(1).required()
  }),

  // Card schemas
  createCard: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(5000).allow('').optional(),
    columnId: Joi.string().uuid().required(),
    position: Joi.number().integer().min(0).optional(),
    assigneeId: Joi.string().uuid().optional(),
    dueDate: Joi.date().iso().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').empty('').default('medium'),
    labels: Joi.array().items(Joi.object({
      name: Joi.string().min(1).max(50).required(),
      color: Joi.string().regex(/^#[0-9A-F]{6}$/i).required()
    })).optional(),
    estimatedHours: Joi.number().precision(2).min(0).optional(),
    checklist: Joi.array().items(Joi.object({
      text: Joi.string().min(1).max(200).required(),
      completed: Joi.boolean().default(false)
    })).optional()
  }),

  updateCard: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(5000).allow('').optional(),
    assigneeId: Joi.string().uuid().allow(null).optional(),
    dueDate: Joi.date().iso().allow(null).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    labels: Joi.array().items(Joi.object({
      name: Joi.string().min(1).max(50).required(),
      color: Joi.string().regex(/^#[0-9A-F]{6}$/i).required()
    })).optional(),
    estimatedHours: Joi.number().precision(2).min(0).allow(null).optional(),
    actualHours: Joi.number().precision(2).min(0).allow(null).optional(),
    checklist: Joi.array().items(Joi.object({
      text: Joi.string().min(1).max(200).required(),
      completed: Joi.boolean().default(false),
      id: Joi.string().optional() // Allow id field for existing checklist items
    })).optional()
  }),

  moveCard: Joi.object({
    columnId: Joi.string().uuid().required(),
    position: Joi.number().integer().min(0).required()
  }),

  // Comment schemas
  createComment: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    parentId: Joi.string().uuid().allow(null)
  }),

  updateComment: Joi.object({
    content: Joi.string().min(1).max(1000).required()
  }),

  createReply: Joi.object({
    content: Joi.string().min(1).max(1000).required()
  }),

  createReaction: Joi.object({
    type: Joi.string().valid('like', 'love', 'laugh', 'angry', 'sad').required()
  }),

  duplicateColumn: Joi.object({
    title: Joi.string().min(1).max(50),
    includeCards: Joi.boolean().default(false)
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
  }),

  notificationIdParam: Joi.object({
    notificationId: Joi.string().uuid().required()
  }),

  userIdParam: Joi.object({
    userId: Joi.string().uuid().required()
  }),

  // Admin schemas
  adminUpdateUser: Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    email: Joi.string().email(),
    role: Joi.string().valid('user', 'admin'),
    isActive: Joi.boolean(),
    verified: Joi.boolean()
  }),

  banUser: Joi.object({
    reason: Joi.string().min(1).max(500).required(),
    duration: Joi.number().integer().min(1).max(365) // days
  }),

  // Query schemas
  usersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().min(1).max(100),
    status: Joi.string().valid('active', 'banned', 'all'),
    role: Joi.string().valid('user', 'admin'),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'firstName', 'lastName', 'email'),
    order: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  boardsQuery: Joi.object({
    status: Joi.string().valid('active', 'archived', 'all').default('active'),
    visibility: Joi.string().valid('private', 'team', 'public'),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'title'),
    order: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    period: Joi.string().valid('7d', '30d', '90d', '1y')
  })
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas
};
