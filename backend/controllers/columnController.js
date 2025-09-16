const { Column, Card, Board } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');
const socketService = require('../services/socketService');

class ColumnController {
  // Get all columns in a board
  async getColumns(req, res) {
    try {
      const { boardId } = req.params;

      const columns = await Column.findAll({
        where: { boardId },
        include: [
          {
            model: Card,
            as: 'cards',
            order: [['position', 'ASC']]
          }
        ],
        order: [['position', 'ASC']]
      });

      res.json({
        success: true,
        data: { columns }
      });
    } catch (error) {
      console.error('Get columns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get columns'
      });
    }
  }

  // Create new column
  async createColumn(req, res) {
    try {
      const { boardId } = req.params;
      const { title, position, color, wipLimit } = req.body;

      if (!req.canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create columns'
        });
      }

      // If position not provided, add to end
      let columnPosition = position;
      if (columnPosition === undefined) {
        const lastColumn = await Column.findOne({
          where: { boardId },
          order: [['position', 'DESC']]
        });
        columnPosition = lastColumn ? lastColumn.position + 1 : 0;
      } else {
        // Update positions of existing columns
        await Column.update(
          { position: sequelize.literal('position + 1') },
          {
            where: {
              boardId,
              position: { [Op.gte]: columnPosition }
            }
          }
        );
      }

      const column = await Column.create({
        title,
        position: columnPosition,
        color: color || '#e2e8f0',
        wipLimit,
        boardId
      });

      // Log audit event
      await auditService.logColumnCreated(column, req.userId, req);

      // Broadcast to board members
      socketService.broadcastColumnUpdate(boardId, column.id, 'created', column);

      res.status(201).json({
        success: true,
        message: 'Column created successfully',
        data: { column }
      });
    } catch (error) {
      console.error('Create column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create column'
      });
    }
  }

  // Update column
  async updateColumn(req, res) {
    try {
      const { boardId, columnId } = req.params;
      const updateData = req.body;

      if (!req.canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update columns'
        });
      }

      const column = await Column.findOne({
        where: { id: columnId, boardId }
      });

      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      const oldValues = {
        title: column.title,
        color: column.color,
        wipLimit: column.wipLimit,
        isCollapsed: column.isCollapsed
      };

      await column.update(updateData);

      // Log audit event
      await auditService.logColumnUpdated(column, oldValues, req.userId, req);

      // Broadcast to board members
      socketService.broadcastColumnUpdate(boardId, columnId, 'updated', column);

      res.json({
        success: true,
        message: 'Column updated successfully',
        data: { column }
      });
    } catch (error) {
      console.error('Update column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update column'
      });
    }
  }

  // Move column
  async moveColumn(req, res) {
    try {
      const { boardId, columnId } = req.params;
      const { position } = req.body;

      if (!req.canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to move columns'
        });
      }

      const column = await Column.findOne({
        where: { id: columnId, boardId }
      });

      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      const oldPosition = column.position;

      if (oldPosition === position) {
        return res.json({
          success: true,
          message: 'Column position unchanged',
          data: { column }
        });
      }

      // Update positions of other columns
      if (oldPosition < position) {
        // Moving right
        await Column.update(
          { position: sequelize.literal('position - 1') },
          {
            where: {
              boardId,
              position: {
                [Op.gt]: oldPosition,
                [Op.lte]: position
              }
            }
          }
        );
      } else {
        // Moving left
        await Column.update(
          { position: sequelize.literal('position + 1') },
          {
            where: {
              boardId,
              position: {
                [Op.gte]: position,
                [Op.lt]: oldPosition
              }
            }
          }
        );
      }

      // Update the moved column
      await column.update({ position });

      // Log audit event
      await auditService.logColumnMoved(column, oldPosition, req.userId, req);

      // Broadcast to board members
      socketService.broadcastColumnUpdate(boardId, columnId, 'moved', {
        id: column.id,
        position,
        oldPosition
      });

      res.json({
        success: true,
        message: 'Column moved successfully',
        data: { column }
      });
    } catch (error) {
      console.error('Move column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move column'
      });
    }
  }

  // Delete column
  async deleteColumn(req, res) {
    try {
      const { boardId, columnId } = req.params;

      if (!req.canDelete) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete columns'
        });
      }

      const column = await Column.findOne({
        where: { id: columnId, boardId },
        include: [
          {
            model: Card,
            as: 'cards'
          }
        ]
      });

      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      // Check if column has cards
      if (column.cards && column.cards.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete column with cards. Please move or delete the cards first.'
        });
      }

      const columnData = column.toJSON();
      const columnPosition = column.position;

      // Delete the column
      await column.destroy();

      // Update positions of remaining columns
      await Column.update(
        { position: sequelize.literal('position - 1') },
        {
          where: {
            boardId,
            position: { [Op.gt]: columnPosition }
          }
        }
      );

      // Log audit event
      await auditService.logColumnDeleted(columnId, columnData, boardId, req.userId, req);

      // Broadcast to board members
      socketService.broadcastColumnUpdate(boardId, columnId, 'deleted', { id: columnId });

      res.json({
        success: true,
        message: 'Column deleted successfully'
      });
    } catch (error) {
      console.error('Delete column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete column'
      });
    }
  }

  // Bulk reorder columns
  async reorderColumns(req, res) {
    try {
      const { boardId } = req.params;
      const { columnIds } = req.body;

      if (!req.canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to reorder columns'
        });
      }

      // Update column positions based on the new order
      const updatePromises = columnIds.map((columnId, index) => 
        Column.update(
          { position: index },
          { where: { id: columnId, boardId } }
        )
      );

      await Promise.all(updatePromises);

      // Log audit event
      await auditService.logColumnsReordered(boardId, columnIds, req.userId, req);

      // Broadcast to board members
      socketService.broadcastColumnUpdate(boardId, null, 'reordered', { columnIds });

      res.json({
        success: true,
        message: 'Columns reordered successfully',
        data: { columnIds }
      });
    } catch (error) {
      console.error('Reorder columns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder columns'
      });
    }
  }

  // Get single column
  async getColumn(req, res) {
    try {
      const { columnId } = req.params;

      const column = await Column.findByPk(columnId, {
        include: [
          {
            model: Card,
            as: 'cards',
            order: [['position', 'ASC']]
          }
        ]
      });

      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      res.json({
        success: true,
        data: { column }
      });
    } catch (error) {
      console.error('Get column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get column'
      });
    }
  }

  // Get cards in column
  async getColumnCards(req, res) {
    try {
      const { columnId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const cards = await Card.findAndCountAll({
        where: { columnId },
        order: [['position', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          cards: cards.rows,
          pagination: {
            total: cards.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(cards.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get column cards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get column cards'
      });
    }
  }

  // Archive column
  async archiveColumn(req, res) {
    try {
      const { columnId } = req.params;

      if (!req.canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to archive columns'
        });
      }

      const column = await Column.findByPk(columnId);
      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      await column.update({ isArchived: true });

      // Audit log
      await auditService.log('COLUMN_ARCHIVED', req.user.id, {
        columnId: column.id,
        boardId: column.boardId
      });

      // Socket notification
      socketService.notifyBoard(column.boardId, 'columnArchived', {
        columnId: column.id
      });

      res.json({
        success: true,
        message: 'Column archived successfully'
      });
    } catch (error) {
      console.error('Archive column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive column'
      });
    }
  }

  // Restore archived column
  async restoreColumn(req, res) {
    try {
      const { columnId } = req.params;

      if (!req.canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to restore columns'
        });
      }

      const column = await Column.findByPk(columnId);
      if (!column) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      await column.update({ isArchived: false });

      // Audit log
      await auditService.log('COLUMN_RESTORED', req.user.id, {
        columnId: column.id,
        boardId: column.boardId
      });

      // Socket notification
      socketService.notifyBoard(column.boardId, 'columnRestored', {
        columnId: column.id
      });

      res.json({
        success: true,
        message: 'Column restored successfully'
      });
    } catch (error) {
      console.error('Restore column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore column'
      });
    }
  }

  // Duplicate column
  async duplicateColumn(req, res) {
    try {
      const { columnId } = req.params;
      const { title, includeCards = false } = req.body;

      if (!req.canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to duplicate columns'
        });
      }

      const originalColumn = await Column.findByPk(columnId, {
        include: includeCards ? [{ model: Card, as: 'cards' }] : []
      });

      if (!originalColumn) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      // Get the highest position
      const maxPosition = await Column.max('position', {
        where: { boardId: originalColumn.boardId }
      });

      // Create new column
      const newColumn = await Column.create({
        title: title || `${originalColumn.title} (Copy)`,
        boardId: originalColumn.boardId,
        position: (maxPosition || 0) + 1,
        color: originalColumn.color,
        wipLimit: originalColumn.wipLimit
      });

      // Duplicate cards if requested
      if (includeCards && originalColumn.cards) {
        for (let i = 0; i < originalColumn.cards.length; i++) {
          const card = originalColumn.cards[i];
          await Card.create({
            title: card.title,
            description: card.description,
            columnId: newColumn.id,
            position: i + 1,
            labels: card.labels,
            priority: card.priority,
            assigneeId: card.assigneeId,
            dueDate: card.dueDate
          });
        }
      }

      // Fetch the complete duplicated column
      const duplicatedColumn = await Column.findByPk(newColumn.id, {
        include: [{ model: Card, as: 'cards' }]
      });

      // Audit log
      await auditService.log('COLUMN_DUPLICATED', req.user.id, {
        originalColumnId: columnId,
        newColumnId: newColumn.id,
        boardId: originalColumn.boardId,
        includeCards
      });

      // Socket notification
      socketService.notifyBoard(originalColumn.boardId, 'columnDuplicated', {
        originalColumnId: columnId,
        newColumn: duplicatedColumn
      });

      res.status(201).json({
        success: true,
        data: { column: duplicatedColumn },
        message: 'Column duplicated successfully'
      });
    } catch (error) {
      console.error('Duplicate column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate column'
      });
    }
  }
}

module.exports = new ColumnController();
