const { Comment, Card, User, Column, Board } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');

class CommentController {
  // Get comments for a card
  async getComments(req, res) {
    try {
      const { cardId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const comments = await Comment.findAndCountAll({
        where: {
          cardId,
          parentId: null // Only top-level comments
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Comment,
            as: 'replies',
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'firstName', 'lastName', 'avatar']
              }
            ],
            order: [['createdAt', 'ASC']]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          comments: comments.rows,
          pagination: {
            total: comments.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(comments.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comments'
      });
    }
  }

  // Create new comment
  async createComment(req, res) {
    try {
      const { boardId, cardId } = req.params;
      const { content, parentId } = req.body;

      // Verify card exists and belongs to board
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

      // Check if board allows comments
      const board = await Board.findByPk(boardId);
      if (board.settings && board.settings.allowComments === false) {
        return res.status(403).json({
          success: false,
          message: 'Comments are not allowed on this board'
        });
      }

      // If it's a reply, verify parent comment exists
      if (parentId) {
        const parentComment = await Comment.findOne({
          where: { id: parentId, cardId }
        });

        if (!parentComment) {
          return res.status(404).json({
            success: false,
            message: 'Parent comment not found'
          });
        }
      }

      // Extract mentions from content
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentions = [];
      let match;

      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]);
      }

      // Get mentioned users
      const mentionedUsers = [];
      if (mentions.length > 0) {
        const users = await User.findAll({
          where: {
            username: { [Op.in]: mentions },
            isActive: true
          },
          attributes: ['id', 'username']
        });
        mentionedUsers.push(...users.map(user => user.id));
      }

      const comment = await Comment.create({
        content,
        cardId,
        authorId: req.userId,
        parentId,
        mentions: mentionedUsers
      });

      // Get the full comment with author info
      const fullComment = await Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ]
      });

      // Log audit event
      await auditService.logCommentCreated(fullComment, req.userId, req);

      // Broadcast to board members
      socketService.broadcastToBoard(boardId, 'comment:created', {
        cardId,
        comment: fullComment
      });

      // Send notifications for mentions
      if (mentionedUsers.length > 0) {
        await notificationService.notifyMention(
          mentionedUsers,
          content,
          cardId,
          req.userId
        );
      }

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: { comment: fullComment }
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment'
      });
    }
  }

  // Update comment
  async updateComment(req, res) {
    try {
      const { boardId, cardId, commentId } = req.params;
      const { content } = req.body;

      const comment = await Comment.findOne({
        where: { id: commentId, cardId },
        include: [
          {
            model: Card,
            as: 'card',
            include: [
              {
                model: Column,
                as: 'column',
                where: { boardId }
              }
            ]
          }
        ]
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Only author can edit their comment
      if (comment.authorId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own comments'
        });
      }

      const oldContent = comment.content;

      // Extract new mentions
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentions = [];
      let match;

      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]);
      }

      // Get mentioned users
      const mentionedUsers = [];
      if (mentions.length > 0) {
        const users = await User.findAll({
          where: {
            username: { [Op.in]: mentions },
            isActive: true
          },
          attributes: ['id', 'username']
        });
        mentionedUsers.push(...users.map(user => user.id));
      }

      await comment.update({
        content,
        mentions: mentionedUsers,
        isEdited: true,
        editedAt: new Date()
      });

      // Get updated comment
      const updatedComment = await Comment.findByPk(commentId, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ]
      });

      // Log audit event
      await auditService.logCommentUpdated(updatedComment, oldContent, req.userId, req);

      // Broadcast to board members
      socketService.broadcastToBoard(boardId, 'comment:updated', {
        cardId,
        comment: updatedComment
      });

      // Send notifications for new mentions
      if (mentionedUsers.length > 0) {
        await notificationService.notifyMention(
          mentionedUsers,
          content,
          cardId,
          req.userId
        );
      }

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment: updatedComment }
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment'
      });
    }
  }

  // Delete comment
  async deleteComment(req, res) {
    try {
      const { boardId, cardId, commentId } = req.params;

      const comment = await Comment.findOne({
        where: { id: commentId, cardId },
        include: [
          {
            model: Card,
            as: 'card',
            include: [
              {
                model: Column,
                as: 'column',
                where: { boardId }
              }
            ]
          }
        ]
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Only author or board admin can delete comment
      if (comment.authorId !== req.userId && !req.canDelete) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this comment'
        });
      }

      const commentData = comment.toJSON();

      // Soft delete
      await comment.destroy();

      // Also soft delete all replies
      await Comment.destroy({
        where: { parentId: commentId }
      });

      // Log audit event
      await auditService.logCommentDeleted(commentId, commentData, boardId, req.userId, req);

      // Broadcast to board members
      socketService.broadcastToBoard(boardId, 'comment:deleted', {
        cardId,
        commentId
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }
}

module.exports = new CommentController();
