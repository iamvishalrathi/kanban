const { Board, Column, Card, BoardMember, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');
const socketService = require('../services/socketService');
const redisService = require('../services/redisService');

class BoardController {
  // Get all boards for user
  async getBoards(req, res) {
    try {
      const { page = 1, limit = 20, search, visibility, archived = false } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }
      if (visibility) {
        whereClause.visibility = visibility;
      }
      whereClause.isArchived = archived === 'true';

      // Get boards where user is owner or member
      const boards = await Board.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: BoardMember,
            as: 'members',
            where: {
              [Op.or]: [
                { userId: req.userId },
                { '$Board.ownerId$': req.userId }
              ],
              isActive: true
            },
            required: true,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'avatar']
              }
            ]
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      res.json({
        success: true,
        data: {
          boards: boards.rows,
          pagination: {
            total: boards.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(boards.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get boards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get boards',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get single board with full details
  async getBoard(req, res) {
    try {
      const { boardId } = req.params;

      // Check cache first
      const cacheKey = `board:${boardId}:${req.userId}`;
      let board = await redisService.get(cacheKey);

      if (!board) {
        board = await Board.findByPk(boardId, {
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            },
            {
              model: Column,
              as: 'columns',
              order: [['position', 'ASC']],
              include: [
                {
                  model: Card,
                  as: 'cards',
                  order: [['position', 'ASC']],
                  include: [
                    {
                      model: User,
                      as: 'assignee',
                      attributes: ['id', 'firstName', 'lastName', 'avatar']
                    },
                    {
                      model: User,
                      as: 'creator',
                      attributes: ['id', 'firstName', 'lastName', 'avatar']
                    }
                  ]
                }
              ]
            },
            {
              model: BoardMember,
              as: 'members',
              where: { isActive: true },
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'firstName', 'lastName', 'avatar']
                }
              ]
            }
          ]
        });

        if (board) {
          // Cache for 5 minutes
          await redisService.set(cacheKey, board, 300);
        }
      }

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      // Get board presence
      const presence = await redisService.getBoardPresence(boardId);

      res.json({
        success: true,
        data: {
          board,
          presence: Object.values(presence)
        }
      });
    } catch (error) {
      console.error('Get board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new board
  async createBoard(req, res) {
    try {
      const { title, description, backgroundColor, visibility, settings } = req.body;

      const board = await Board.create({
        title,
        description,
        backgroundColor,
        visibility,
        settings,
        ownerId: req.userId
      });

      // Create default columns
      const defaultColumns = [
        { title: 'To Do', position: 0, color: '#e2e8f0' },
        { title: 'In Progress', position: 1, color: '#fef3c7' },
        { title: 'Done', position: 2, color: '#d1fae5' }
      ];

      const columns = await Promise.all(
        defaultColumns.map(columnData =>
          Column.create({
            ...columnData,
            boardId: board.id
          })
        )
      );

      // Add owner as admin member
      await BoardMember.create({
        boardId: board.id,
        userId: req.userId,
        role: 'owner',
        permissions: {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true
        }
      });

      // Log audit event
      await auditService.logBoardCreated(board, req.userId, req);

      // Include columns in response
      const boardWithColumns = await Board.findByPk(board.id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Column,
            as: 'columns',
            order: [['position', 'ASC']]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Board created successfully',
        data: { board: boardWithColumns }
      });
    } catch (error) {
      console.error('Create board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update board
  async updateBoard(req, res) {
    try {
      const { boardId } = req.params;
      const updateData = req.body;

      const board = req.board; // From middleware
      const oldValues = {
        title: board.title,
        description: board.description,
        backgroundColor: board.backgroundColor,
        visibility: board.visibility,
        settings: board.settings
      };

      await board.update(updateData);

      // Clear cache
      await redisService.del(`board:${boardId}:*`);

      // Log audit event
      await auditService.logBoardUpdated(board, oldValues, req.userId, req);

      // Broadcast update to all board members
      socketService.broadcastBoardUpdate(boardId, 'updated', {
        id: board.id,
        title: board.title,
        description: board.description,
        backgroundColor: board.backgroundColor,
        settings: board.settings
      });

      res.json({
        success: true,
        message: 'Board updated successfully',
        data: { board }
      });
    } catch (error) {
      console.error('Update board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete board
  async deleteBoard(req, res) {
    try {
      const { boardId } = req.params;
      const board = req.board; // From middleware

      if (!req.canDelete) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this board'
        });
      }

      const boardData = board.toJSON();

      // Soft delete
      await board.destroy();

      // Clear cache
      await redisService.del(`board:${boardId}:*`);

      // Log audit event
      await auditService.logBoardDeleted(boardId, boardData, req.userId, req);

      // Broadcast deletion to all board members
      socketService.broadcastBoardUpdate(boardId, 'deleted', { id: boardId });

      res.json({
        success: true,
        message: 'Board deleted successfully'
      });
    } catch (error) {
      console.error('Delete board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Archive/Unarchive board
  async toggleArchiveBoard(req, res) {
    try {
      const { boardId } = req.params;
      const board = req.board; // From middleware

      const isArchived = !board.isArchived;
      await board.update({ isArchived });

      // Clear cache
      await redisService.del(`board:${boardId}:*`);

      // Log audit event
      await auditService.logBoardArchived(board, req.userId, req);

      // Broadcast update to all board members
      socketService.broadcastBoardUpdate(boardId, 'archived', {
        id: board.id,
        isArchived
      });

      res.json({
        success: true,
        message: `Board ${isArchived ? 'archived' : 'unarchived'} successfully`,
        data: { board }
      });
    } catch (error) {
      console.error('Toggle archive board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive/unarchive board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Duplicate board
  async duplicateBoard(req, res) {
    try {
      const { boardId } = req.params;
      const { title } = req.body;

      const originalBoard = await Board.findByPk(boardId, {
        include: [
          {
            model: Column,
            as: 'columns',
            include: [
              {
                model: Card,
                as: 'cards'
              }
            ]
          }
        ]
      });

      if (!originalBoard) {
        return res.status(404).json({
          success: false,
          message: 'Original board not found'
        });
      }

      // Create new board
      const newBoard = await Board.create({
        title: title || `${originalBoard.title} (Copy)`,
        description: originalBoard.description,
        backgroundColor: originalBoard.backgroundColor,
        visibility: 'private', // Always create duplicates as private
        settings: originalBoard.settings,
        ownerId: req.userId
      });

      // Add owner as admin member
      await BoardMember.create({
        boardId: newBoard.id,
        userId: req.userId,
        role: 'owner',
        permissions: {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true
        }
      });

      // Duplicate columns and cards
      for (const column of originalBoard.columns) {
        const newColumn = await Column.create({
          title: column.title,
          position: column.position,
          color: column.color,
          wipLimit: column.wipLimit,
          boardId: newBoard.id
        });

        // Duplicate cards (without assignees for privacy)
        for (const card of column.cards) {
          await Card.create({
            title: card.title,
            description: card.description,
            position: card.position,
            priority: card.priority,
            labels: card.labels,
            estimatedHours: card.estimatedHours,
            columnId: newColumn.id,
            createdById: req.userId
            // Note: assigneeId is intentionally omitted
          });
        }
      }

      // Get the complete duplicated board
      const duplicatedBoard = await Board.findByPk(newBoard.id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
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
        message: 'Board duplicated successfully',
        data: { board: duplicatedBoard }
      });
    } catch (error) {
      console.error('Duplicate board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Export board as JSON
  async exportBoard(req, res) {
    try {
      const { boardId } = req.params;

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
                include: [
                  {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                  },
                  {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                  }
                ]
              }
            ]
          },
          {
            model: BoardMember,
            as: 'members',
            where: { isActive: true },
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
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

      const exportData = {
        board: {
          title: board.title,
          description: board.description,
          backgroundColor: board.backgroundColor,
          settings: board.settings,
          exportedAt: new Date(),
          exportedBy: req.user.firstName + ' ' + req.user.lastName
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
            dueDate: card.dueDate,
            estimatedHours: card.estimatedHours,
            actualHours: card.actualHours,
            checklist: card.checklist,
            assignee: card.assignee ? {
              firstName: card.assignee.firstName,
              lastName: card.assignee.lastName,
              email: card.assignee.email
            } : null,
            creator: {
              firstName: card.creator.firstName,
              lastName: card.creator.lastName,
              email: card.creator.email
            },
            createdAt: card.createdAt,
            updatedAt: card.updatedAt
          }))
        })),
        members: board.members.map(member => ({
          user: {
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            email: member.user.email
          },
          role: member.role,
          joinedAt: member.joinedAt
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${board.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json"`);
      
      res.json(exportData);
    } catch (error) {
      console.error('Export board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get board statistics
  async getBoardStats(req, res) {
    try {
      const { boardId } = req.params;

      // Get stats from cache first
      const cacheKey = `board:${boardId}:stats`;
      let stats = await redisService.get(cacheKey);

      if (!stats) {
        const board = await Board.findByPk(boardId, {
          include: [
            {
              model: Column,
              as: 'columns',
              include: [
                {
                  model: Card,
                  as: 'cards',
                  paranoid: false // Include soft deleted cards for complete stats
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

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let totalCards = 0;
        let completedCards = 0;
        let overdueCards = 0;
        let cardsThisWeek = 0;
        let cardsThisMonth = 0;
        const columnStats = {};
        const priorityStats = { low: 0, medium: 0, high: 0, urgent: 0 };

        board.columns.forEach(column => {
          columnStats[column.title] = {
            total: column.cards.length,
            active: column.cards.filter(card => !card.deletedAt).length
          };

          column.cards.forEach(card => {
            totalCards++;
            
            if (card.createdAt >= weekAgo) cardsThisWeek++;
            if (card.createdAt >= monthAgo) cardsThisMonth++;
            
            if (!card.deletedAt) {
              priorityStats[card.priority]++;
              
              // Assuming last column is "Done"
              if (column.position === board.columns.length - 1) {
                completedCards++;
              }
              
              if (card.dueDate && card.dueDate < now && column.position !== board.columns.length - 1) {
                overdueCards++;
              }
            }
          });
        });

        stats = {
          totalCards,
          activeCards: totalCards - board.columns.reduce((sum, col) => 
            sum + col.cards.filter(card => card.deletedAt).length, 0),
          completedCards,
          overdueCards,
          cardsThisWeek,
          cardsThisMonth,
          completionRate: totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0,
          columnStats,
          priorityStats,
          generatedAt: now
        };

        // Cache for 10 minutes
        await redisService.set(cacheKey, stats, 600);
      }

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Get board stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get board statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new BoardController();
