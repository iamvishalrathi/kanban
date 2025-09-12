const { Card, Column, User, Board, Comment } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');
const redisService = require('../services/redisService');

class CardController {
  // Get all cards in a board
  async getCards(req, res) {
    try {
      const { boardId } = req.params;
      const { columnId, assigneeId, priority, search, dueDate } = req.query;

      const whereClause = {};
      if (columnId) whereClause.columnId = columnId;
      if (assigneeId) whereClause.assigneeId = assigneeId;
      if (priority) whereClause.priority = priority;
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }
      if (dueDate) {
        const date = new Date(dueDate);
        const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        whereClause.dueDate = { [Op.between]: [date, nextDay] };
      }

      const cards = await Card.findAll({
        where: whereClause,
        include: [
          {
            model: Column,
            as: 'column',
            where: { boardId },
            attributes: ['id', 'title', 'boardId']
          },
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
        ],
        order: [['position', 'ASC']]
      });

      res.json({
        success: true,
        data: { cards }
      });
    } catch (error) {
      console.error('Get cards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cards'
      });
    }
  }

  // Get single card
  async getCard(req, res) {
    try {
      const { cardId } = req.params;

      const card = await Card.findByPk(cardId, {
        include: [
          {
            model: Column,
            as: 'column',
            include: [{ model: Board, as: 'board' }]
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Comment,
            as: 'comments',
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'firstName', 'lastName', 'avatar']
              }
            ],
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }

      res.json({
        success: true,
        data: { card }
      });
    } catch (error) {
      console.error('Get card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get card'
      });
    }
  }

  // Create new card
  async createCard(req, res) {
    try {
      const { boardId } = req.params;
      const { title, description, columnId, position, assigneeId, dueDate, priority, labels, estimatedHours, checklist } = req.body;

      // Get the column to verify it belongs to the board
      const column = await Column.findOne({
        where: { id: columnId, boardId }
      });

      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found in this board'
        });
      }

      // If position not provided, add to end
      let cardPosition = position;
      if (cardPosition === undefined) {
        const lastCard = await Card.findOne({
          where: { columnId },
          order: [['position', 'DESC']]
        });
        cardPosition = lastCard ? lastCard.position + 1 : 0;
      }

      const card = await Card.create({
        title,
        description,
        columnId,
        position: cardPosition,
        assigneeId,
        dueDate,
        priority,
        labels: labels || [],
        estimatedHours,
        checklist: checklist || [],
        createdById: req.userId
      });

      // Get the full card with relations
      const fullCard = await Card.findByPk(card.id, {
        include: [
          {
            model: Column,
            as: 'column'
          },
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
      });

      // Log audit event
      await auditService.logCardCreated(fullCard, req.userId, req);

      // Broadcast to board members
      socketService.broadcastCardUpdate(boardId, card.id, 'created', fullCard);

      // Send notification if assigned to someone else
      if (assigneeId && assigneeId !== req.userId) {
        await notificationService.notifyCardAssignment(card.id, assigneeId, req.userId);
      }

      res.status(201).json({
        success: true,
        message: 'Card created successfully',
        data: { card: fullCard }
      });
    } catch (error) {
      console.error('Create card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create card'
      });
    }
  }

  // Update card
  async updateCard(req, res) {
    try {
      const { boardId, cardId } = req.params;
      const updateData = req.body;

      const card = await Card.findOne({
        where: { id: cardId },
        include: [
          {
            model: Column,
            as: 'column',
            where: { boardId }
          }
        ]
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }

      const oldValues = {
        title: card.title,
        description: card.description,
        assigneeId: card.assigneeId,
        dueDate: card.dueDate,
        priority: card.priority,
        labels: card.labels,
        estimatedHours: card.estimatedHours,
        actualHours: card.actualHours,
        checklist: card.checklist
      };

      const oldAssigneeId = card.assigneeId;

      await card.update(updateData);

      // Get updated card with relations
      const updatedCard = await Card.findByPk(card.id, {
        include: [
          {
            model: Column,
            as: 'column'
          },
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
      });

      // Log audit event
      await auditService.logCardUpdated(updatedCard, oldValues, req.userId, req);

      // Broadcast to board members
      socketService.broadcastCardUpdate(boardId, cardId, 'updated', updatedCard);

      // Handle assignment notifications
      if (updateData.assigneeId !== undefined && updateData.assigneeId !== oldAssigneeId) {
        if (updateData.assigneeId && updateData.assigneeId !== req.userId) {
          await notificationService.notifyCardAssignment(cardId, updateData.assigneeId, req.userId);
        }
        await auditService.logCardAssigned(updatedCard, oldAssigneeId, req.userId, req);
      }

      res.json({
        success: true,
        message: 'Card updated successfully',
        data: { card: updatedCard }
      });
    } catch (error) {
      console.error('Update card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update card'
      });
    }
  }

  // Move card to different column/position
  async moveCard(req, res) {
    try {
      const { boardId, cardId } = req.params;
      const { columnId, position } = req.body;

      // Acquire lock for this operation
      const lockKey = `move_card:${cardId}`;
      const lockValue = await redisService.acquireLock(lockKey, req.userId, 10000);

      if (!lockValue) {
        return res.status(409).json({
          success: false,
          message: 'Card is being moved by another user'
        });
      }

      try {
        const card = await Card.findOne({
          where: { id: cardId },
          include: [
            {
              model: Column,
              as: 'column',
              where: { boardId }
            }
          ]
        });

        if (!card) {
          return res.status(404).json({
            success: false,
            message: 'Card not found'
          });
        }

        // Verify target column belongs to board
        const targetColumn = await Column.findOne({
          where: { id: columnId, boardId }
        });

        if (!targetColumn) {
          return res.status(404).json({
            success: false,
            message: 'Target column not found'
          });
        }

        const oldColumnId = card.columnId;
        const oldPosition = card.position;
        const oldColumnTitle = card.column.title;

        // Update positions in old column (if different)
        if (oldColumnId !== columnId) {
          await Card.update(
            { position: sequelize.literal('position - 1') },
            {
              where: {
                columnId: oldColumnId,
                position: { [Op.gt]: oldPosition }
              }
            }
          );
        }

        // Update positions in new column
        await Card.update(
          { position: sequelize.literal('position + 1') },
          {
            where: {
              columnId: columnId,
              position: { [Op.gte]: position }
            }
          }
        );

        // Move the card
        await card.update({
          columnId,
          position
        });

        // Get updated card
        const updatedCard = await Card.findByPk(cardId, {
          include: [
            {
              model: Column,
              as: 'column'
            },
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }
          ]
        });

        // Log audit event
        await auditService.logCardMoved(updatedCard, oldColumnId, oldPosition, req.userId, req);

        // Broadcast to board members
        socketService.broadcastCardUpdate(boardId, cardId, 'moved', {
          card: updatedCard,
          oldColumnId,
          newColumnId: columnId
        });

        // Send notification if card is assigned
        if (card.assigneeId && card.assigneeId !== req.userId) {
          await notificationService.notifyCardMoved(
            cardId,
            req.userId,
            oldColumnTitle,
            targetColumn.title
          );
        }

        res.json({
          success: true,
          message: 'Card moved successfully',
          data: { card: updatedCard }
        });
      } finally {
        await redisService.releaseLock(lockKey, lockValue);
      }
    } catch (error) {
      console.error('Move card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move card'
      });
    }
  }

  // Delete card
  async deleteCard(req, res) {
    try {
      const { boardId, cardId } = req.params;

      const card = await Card.findOne({
        where: { id: cardId },
        include: [
          {
            model: Column,
            as: 'column',
            where: { boardId }
          }
        ]
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }

      if (!req.canDelete && card.createdById !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this card'
        });
      }

      const cardData = card.toJSON();

      // Soft delete
      await card.destroy();

      // Update positions of remaining cards
      await Card.update(
        { position: sequelize.literal('position - 1') },
        {
          where: {
            columnId: card.columnId,
            position: { [Op.gt]: card.position }
          }
        }
      );

      // Log audit event
      await auditService.logCardDeleted(cardId, cardData, boardId, req.userId, req);

      // Broadcast to board members
      socketService.broadcastCardUpdate(boardId, cardId, 'deleted', { id: cardId });

      res.json({
        success: true,
        message: 'Card deleted successfully'
      });
    } catch (error) {
      console.error('Delete card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete card'
      });
    }
  }

  // Create card without boardId in URL (for direct card creation)
  async createDirectCard(req, res) {
    try {
      const { title, description, columnId, position, assigneeId, dueDate, priority, labels, estimatedHours, checklist } = req.body;

      // Get the column and its board to verify access
      const column = await Column.findOne({
        where: { id: columnId },
        include: [{
          model: Board,
          as: 'board',
          attributes: ['id', 'title']
        }]
      });

      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      // Use the boardId from the column
      const boardId = column.board.id;

      // If position not provided, add to end
      let cardPosition = position;
      if (cardPosition === undefined) {
        const lastCard = await Card.findOne({
          where: { columnId },
          order: [['position', 'DESC']]
        });
        cardPosition = lastCard ? lastCard.position + 1 : 0;
      }

      // Create the card
      const card = await Card.create({
        title,
        description,
        columnId,
        boardId,
        position: cardPosition,
        assigneeId,
        dueDate,
        priority: priority || 'medium',
        labels: labels || [],
        estimatedHours,
        checklist: checklist || [],
        createdById: req.userId
      });

      // Fetch the complete card with associations
      const cardWithAssociations = await Card.findByPk(card.id, {
        include: [
          {
            model: Column,
            as: 'column',
            attributes: ['id', 'title']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          }
        ]
      });

      // Create audit log
      await auditService.logCardCreated(cardWithAssociations, req.userId, req, boardId);

      // Send notification if assigned to someone else
      if (assigneeId && assigneeId !== req.userId) {
        await notificationService.notifyCardAssignment(card.id, assigneeId, req.userId);
      }

      // Emit real-time update
      socketService.broadcastCardUpdate(boardId, card.id, 'created', cardWithAssociations);

      // Clear related cache
      await redisService.del(`cards:board:${boardId}`);
      await redisService.del(`board:${boardId}`);

      res.status(201).json({
        success: true,
        message: 'Card created successfully',
        card: cardWithAssociations
      });

    } catch (error) {
      console.error('Create direct card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create card'
      });
    }
  }
}

module.exports = new CardController();
