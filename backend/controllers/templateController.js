const { Template, User, Board, Column, Card } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');

class TemplateController {
  // Get all templates
  async getTemplates(req, res) {
    try {
      const { category, search, page = 1, limit = 20, isPublic } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};

      // Filter by category
      if (category && category !== 'all') {
        whereClause.category = category;
      }

      // Filter by public/private
      if (isPublic !== undefined) {
        if (isPublic === 'true') {
          whereClause[Op.or] = [
            { isPublic: true },
            { isOfficial: true },
            { createdById: req.userId }
          ];
        } else {
          whereClause.createdById = req.userId;
        }
      } else {
        // Default: show public, official, and user's own templates
        whereClause[Op.or] = [
          { isPublic: true },
          { isOfficial: true },
          { createdById: req.userId }
        ];
      }

      // Search functionality
      if (search) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
            { tags: { [Op.contains]: [search] } }
          ]
        });
      }

      const templates = await Template.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ],
        order: [
          ['isOfficial', 'DESC'],
          ['usageCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          templates: templates.rows,
          pagination: {
            total: templates.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(templates.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get templates'
      });
    }
  }

  // Get template categories
  async getCategories(req, res) {
    try {
      const categories = await Template.findAll({
        attributes: ['category'],
        group: ['category'],
        raw: true
      });

      const categoryList = [
        { value: 'general', label: 'General', icon: '📋' },
        { value: 'software', label: 'Software Development', icon: '💻' },
        { value: 'marketing', label: 'Marketing', icon: '📈' },
        { value: 'hr', label: 'Human Resources', icon: '👥' },
        { value: 'project-management', label: 'Project Management', icon: '🎯' },
        { value: 'personal', label: 'Personal', icon: '👤' }
      ];

      res.json({
        success: true,
        data: { categories: categoryList }
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories'
      });
    }
  }

  // Get single template
  async getTemplate(req, res) {
    try {
      const { templateId } = req.params;

      const template = await Template.findByPk(templateId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check access permissions
      if (!template.isPublic && !template.isOfficial && template.createdById !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: { template }
      });
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get template'
      });
    }
  }

  // Create template from board
  async createTemplate(req, res) {
    try {
      const { boardId } = req.params;
      const { name, description, category, isPublic, tags } = req.body;

      // Get the board with all its structure
      const board = await Board.findByPk(boardId, {
        include: [
          {
            model: Column,
            as: 'columns',
            order: [['position', 'ASC']],
            include: [
              {
                model: Card,
                as: 'cards',
                order: [['position', 'ASC']],
                attributes: ['title', 'description', 'position', 'priority', 'labels', 'estimatedHours', 'checklist']
              }
            ]
          }
        ]
      });

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      // Check if user is owner or has permission
      if (board.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only board owner can create templates'
        });
      }

      // Create template configuration
      const config = {
        board: {
          title: name,
          description: description || board.description,
          backgroundColor: board.backgroundColor,
          settings: board.settings
        },
        columns: board.columns.map(column => ({
          title: column.title,
          position: column.position,
          color: column.color,
          wipLimit: column.wipLimit,
          cards: column.cards.map(card => ({
            title: card.title,
            description: card.description,
            position: card.position,
            priority: card.priority,
            labels: card.labels,
            estimatedHours: card.estimatedHours,
            checklist: card.checklist
          }))
        }))
      };

      const template = await Template.create({
        name,
        description,
        category: category || 'general',
        isPublic: isPublic || false,
        tags: tags || [],
        config,
        createdById: req.userId
      });

      // Log audit event
      await auditService.logTemplateCreated(template, boardId, req.userId, req);

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: { template }
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template'
      });
    }
  }

  // Create board from template
  async useTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { title, description } = req.body;

      const template = await Template.findByPk(templateId);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check access permissions
      if (!template.isPublic && !template.isOfficial && template.createdById !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { config } = template;

      // Create board
      const board = await Board.create({
        title: title || config.board.title,
        description: description || config.board.description,
        backgroundColor: config.board.backgroundColor,
        visibility: 'private',
        settings: config.board.settings,
        ownerId: req.userId
      });

      // Create columns and cards
      for (const columnData of config.columns) {
        const column = await Column.create({
          title: columnData.title,
          position: columnData.position,
          color: columnData.color,
          wipLimit: columnData.wipLimit,
          boardId: board.id
        });

        // Create cards
        for (const cardData of columnData.cards || []) {
          await Card.create({
            title: cardData.title,
            description: cardData.description,
            position: cardData.position,
            priority: cardData.priority,
            labels: cardData.labels,
            estimatedHours: cardData.estimatedHours,
            checklist: cardData.checklist,
            columnId: column.id,
            createdById: req.userId
          });
        }
      }

      // Increment usage count
      await template.increment('usageCount');

      // Log audit event
      await auditService.logBoardCreatedFromTemplate(board, template, req.userId, req);

      // Get the complete board
      const completeBoard = await Board.findByPk(board.id, {
        include: [
          {
            model: Column,
            as: 'columns',
            order: [['position', 'ASC']],
            include: [
              {
                model: Card,
                as: 'cards',
                order: [['position', 'ASC']]
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Board created from template successfully',
        data: { board: completeBoard }
      });
    } catch (error) {
      console.error('Use template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create board from template'
      });
    }
  }

  // Update template
  async updateTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const updateData = req.body;

      const template = await Template.findByPk(templateId);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check permissions
      if (template.createdById !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only template creator can update it'
        });
      }

      await template.update(updateData);

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: { template }
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template'
      });
    }
  }

  // Delete template
  async deleteTemplate(req, res) {
    try {
      const { templateId } = req.params;

      const template = await Template.findByPk(templateId);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check permissions
      if (template.createdById !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only template creator can delete it'
        });
      }

      await template.destroy();

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template'
      });
    }
  }

  // Get official templates
  async getOfficialTemplates(req, res) {
    try {
      const templates = await Template.findAll({
        where: { isOfficial: true },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ],
        order: [['usageCount', 'DESC']]
      });

      res.json({
        success: true,
        data: { templates }
      });
    } catch (error) {
      console.error('Get official templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get official templates'
      });
    }
  }
}

module.exports = new TemplateController();