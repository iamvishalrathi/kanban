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
}

module.exports = new ColumnController();
