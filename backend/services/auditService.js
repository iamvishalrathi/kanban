const { AuditLog } = require('../models');

class AuditService {
  async log({
    action,
    entityType,
    entityId,
    boardId,
    userId,
    oldValues = null,
    newValues = null,
    metadata = {},
    req = null
  }) {
    try {
      const auditData = {
        action,
        entityType,
        entityId,
        boardId,
        userId,
        oldValues,
        newValues,
        metadata
      };

      // Extract request information if available
      if (req) {
        auditData.ipAddress = this.getClientIP(req);
        auditData.userAgent = req.get('User-Agent');
      }

      const auditLog = await AuditLog.create(auditData);

      // Emit real-time audit event for admin panel
      const io = global.io;
      if (io) {
        io.to('admin').emit('audit:log', {
          id: auditLog.id,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          boardId: auditLog.boardId,
          userId: auditLog.userId,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt
        });
      }

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error to avoid disrupting main operation
    }
  }

  getClientIP(req) {
    return req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);
  }

  // Board audit methods
  async logBoardCreated(board, userId, req) {
    return this.log({
      action: 'board_created',
      entityType: 'board',
      entityId: board.id,
      boardId: board.id,
      userId,
      newValues: {
        title: board.title,
        description: board.description,
        visibility: board.visibility
      },
      req
    });
  }

  async logBoardUpdated(board, oldValues, userId, req) {
    return this.log({
      action: 'board_updated',
      entityType: 'board',
      entityId: board.id,
      boardId: board.id,
      userId,
      oldValues,
      newValues: {
        title: board.title,
        description: board.description,
        visibility: board.visibility,
        settings: board.settings
      },
      req
    });
  }

  async logBoardDeleted(boardId, boardData, userId, req) {
    return this.log({
      action: 'board_deleted',
      entityType: 'board',
      entityId: boardId,
      boardId: boardId,
      userId,
      oldValues: boardData,
      req
    });
  }

  async logBoardArchived(board, userId, req) {
    return this.log({
      action: 'board_archived',
      entityType: 'board',
      entityId: board.id,
      boardId: board.id,
      userId,
      newValues: { isArchived: board.isArchived },
      req
    });
  }

  // Column audit methods
  async logColumnCreated(column, userId, req) {
    return this.log({
      action: 'column_created',
      entityType: 'column',
      entityId: column.id,
      boardId: column.boardId,
      userId,
      newValues: {
        title: column.title,
        position: column.position,
        color: column.color
      },
      req
    });
  }

  async logColumnUpdated(column, oldValues, userId, req) {
    return this.log({
      action: 'column_updated',
      entityType: 'column',
      entityId: column.id,
      boardId: column.boardId,
      userId,
      oldValues,
      newValues: {
        title: column.title,
        position: column.position,
        color: column.color,
        wipLimit: column.wipLimit
      },
      req
    });
  }

  async logColumnDeleted(columnId, columnData, boardId, userId, req) {
    return this.log({
      action: 'column_deleted',
      entityType: 'column',
      entityId: columnId,
      boardId: boardId,
      userId,
      oldValues: columnData,
      req
    });
  }

  async logColumnMoved(column, oldPosition, userId, req) {
    return this.log({
      action: 'column_moved',
      entityType: 'column',
      entityId: column.id,
      boardId: column.boardId,
      userId,
      oldValues: { position: oldPosition },
      newValues: { position: column.position },
      req
    });
  }

  async logColumnsReordered(boardId, columnIds, userId, req) {
    return this.log({
      action: 'columns_reordered',
      entityType: 'board',
      entityId: boardId,
      boardId: boardId,
      userId,
      newValues: { columnOrder: columnIds },
      req
    });
  }

  // Card audit methods
  async logCardCreated(card, userId, req, explicitBoardId = null) {
    const boardId = explicitBoardId || card.boardId || card.column?.boardId;
    
    if (!boardId) {
      console.warn('No boardId found for card audit log:', card.id);
    }
    
    return this.log({
      action: 'card_created',
      entityType: 'card',
      entityId: card.id,
      boardId: boardId,
      userId,
      newValues: {
        title: card.title,
        description: card.description,
        columnId: card.columnId,
        position: card.position,
        priority: card.priority,
        assigneeId: card.assigneeId
      },
      req
    });
  }

  async logCardUpdated(card, oldValues, userId, req) {
    return this.log({
      action: 'card_updated',
      entityType: 'card',
      entityId: card.id,
      boardId: card.column?.boardId,
      userId,
      oldValues,
      newValues: {
        title: card.title,
        description: card.description,
        priority: card.priority,
        assigneeId: card.assigneeId,
        dueDate: card.dueDate,
        labels: card.labels
      },
      req
    });
  }

  async logCardDeleted(cardId, cardData, boardId, userId, req) {
    return this.log({
      action: 'card_deleted',
      entityType: 'card',
      entityId: cardId,
      boardId: boardId,
      userId,
      oldValues: cardData,
      req
    });
  }

  async logCardMoved(card, oldColumnId, oldPosition, userId, req) {
    return this.log({
      action: 'card_moved',
      entityType: 'card',
      entityId: card.id,
      boardId: card.column?.boardId,
      userId,
      oldValues: {
        columnId: oldColumnId,
        position: oldPosition
      },
      newValues: {
        columnId: card.columnId,
        position: card.position
      },
      metadata: {
        fromColumn: oldColumnId,
        toColumn: card.columnId
      },
      req
    });
  }

  async logCardAssigned(card, oldAssigneeId, userId, req) {
    return this.log({
      action: 'card_assigned',
      entityType: 'card',
      entityId: card.id,
      boardId: card.column?.boardId,
      userId,
      oldValues: { assigneeId: oldAssigneeId },
      newValues: { assigneeId: card.assigneeId },
      req
    });
  }

  // Comment audit methods
  async logCommentCreated(comment, userId, req) {
    return this.log({
      action: 'comment_created',
      entityType: 'comment',
      entityId: comment.id,
      boardId: comment.card?.column?.boardId,
      userId,
      newValues: {
        content: comment.content,
        cardId: comment.cardId,
        mentions: comment.mentions
      },
      req
    });
  }

  async logCommentUpdated(comment, oldContent, userId, req) {
    return this.log({
      action: 'comment_updated',
      entityType: 'comment',
      entityId: comment.id,
      boardId: comment.card?.column?.boardId,
      userId,
      oldValues: { content: oldContent },
      newValues: { content: comment.content },
      req
    });
  }

  async logCommentDeleted(commentId, commentData, boardId, userId, req) {
    return this.log({
      action: 'comment_deleted',
      entityType: 'comment',
      entityId: commentId,
      boardId: boardId,
      userId,
      oldValues: commentData,
      req
    });
  }

  // Member audit methods
  async logMemberAdded(boardId, addedUserId, role, userId, req) {
    return this.log({
      action: 'member_added',
      entityType: 'member',
      entityId: addedUserId,
      boardId: boardId,
      userId,
      newValues: {
        addedUserId,
        role
      },
      req
    });
  }

  async logMemberRemoved(boardId, removedUserId, role, userId, req) {
    return this.log({
      action: 'member_removed',
      entityType: 'member',
      entityId: removedUserId,
      boardId: boardId,
      userId,
      oldValues: {
        removedUserId,
        role
      },
      req
    });
  }

  async logMemberRoleChanged(boardId, memberId, oldRole, newRole, userId, req) {
    return this.log({
      action: 'member_role_changed',
      entityType: 'member',
      entityId: memberId,
      boardId: boardId,
      userId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      req
    });
  }

  // Query methods for admin panel
  async getBoardAuditLogs(boardId, { page = 1, limit = 50, actions = null } = {}) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = { boardId };

      if (actions && actions.length > 0) {
        whereClause.action = actions;
      }

      const logs = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        logs: logs.rows,
        total: logs.count,
        page,
        totalPages: Math.ceil(logs.count / limit)
      };
    } catch (error) {
      console.error('Error getting board audit logs:', error);
      throw error;
    }
  }

  async getSystemAuditLogs({ page = 1, limit = 100, actions = null, userId = null, dateFrom = null, dateTo = null } = {}) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = {};

      if (actions && actions.length > 0) {
        whereClause.action = actions;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
      }

      const logs = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Board,
            as: 'board',
            attributes: ['id', 'title']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        logs: logs.rows,
        total: logs.count,
        page,
        totalPages: Math.ceil(logs.count / limit)
      };
    } catch (error) {
      console.error('Error getting system audit logs:', error);
      throw error;
    }
  }

  async getAuditStats(boardId = null, timeRange = '7d') {
    try {
      let dateFrom;
      const now = new Date();

      switch (timeRange) {
        case '1d':
          dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const whereClause = {
        createdAt: {
          [Op.gte]: dateFrom
        }
      };

      if (boardId) {
        whereClause.boardId = boardId;
      }

      const stats = await AuditLog.findAll({
        where: whereClause,
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['action'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      });

      const totalActions = await AuditLog.count({ where: whereClause });

      const dailyStats = await AuditLog.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      return {
        totalActions,
        actionBreakdown: stats.map(stat => ({
          action: stat.action,
          count: parseInt(stat.dataValues.count)
        })),
        dailyBreakdown: dailyStats.map(stat => ({
          date: stat.dataValues.date,
          count: parseInt(stat.dataValues.count)
        }))
      };
    } catch (error) {
      console.error('Error getting audit stats:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
