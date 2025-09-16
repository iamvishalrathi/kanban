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
      const { cardId } = req.params;
      const { content, parentId } = req.body;
      
      // Get boardId from checkCardAccess middleware or request params
      const boardId = req.boardId || req.params.boardId;
      
      if (!boardId) {
        return res.status(400).json({
          success: false,
          message: 'Board ID not found'
        });
      }

      // Use the card from middleware if available, otherwise fetch it
      let card = req.card;
      if (!card) {
        card = await Card.findOne({
          where: { id: cardId },
          include: [
            {
              model: Column,
              as: 'column',
              where: { boardId }
            }
          ]
        });
      }

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

  // Get single comment
  async getComment(req, res) {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findByPk(commentId, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Comment,
            as: 'replies',
            include: [{
              model: User,
              as: 'author',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }],
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        data: { comment }
      });
    } catch (error) {
      console.error('Get comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comment'
      });
    }
  }

  // Create reply to comment
  async createReply(req, res) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      const parentComment = await Comment.findByPk(commentId, {
        include: [{ model: Card, include: [{ model: Column, include: [Board] }] }]
      });

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      const reply = await Comment.create({
        content,
        cardId: parentComment.cardId,
        parentId: commentId,
        authorId: req.user.id
      });

      const replyWithAuthor = await Comment.findByPk(reply.id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }]
      });

      // Audit log
      await auditService.log('COMMENT_REPLY_CREATED', req.user.id, {
        commentId: reply.id,
        cardId: parentComment.cardId,
        parentCommentId: commentId
      });

      // Socket notification
      socketService.notifyCard(parentComment.cardId, 'commentReplyCreated', {
        reply: replyWithAuthor
      });

      res.status(201).json({
        success: true,
        data: { reply: replyWithAuthor },
        message: 'Reply created successfully'
      });
    } catch (error) {
      console.error('Create reply error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create reply'
      });
    }
  }

  // Get comment replies
  async getReplies(req, res) {
    try {
      const { commentId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const replies = await Comment.findAndCountAll({
        where: { parentId: commentId },
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }],
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          replies: replies.rows,
          pagination: {
            total: replies.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(replies.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get replies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get replies'
      });
    }
  }

  // Add reaction to comment
  async addReaction(req, res) {
    try {
      const { commentId } = req.params;
      const { type } = req.body;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const reactions = comment.reactions || {};
      if (!reactions[type]) {
        reactions[type] = [];
      }

      const userReactionIndex = reactions[type].indexOf(req.user.id);
      if (userReactionIndex === -1) {
        reactions[type].push(req.user.id);
      }

      await comment.update({ reactions });

      // Audit log
      await auditService.log('COMMENT_REACTION_ADDED', req.user.id, {
        commentId,
        reactionType: type
      });

      // Socket notification
      socketService.notifyCard(comment.cardId, 'commentReactionAdded', {
        commentId,
        reaction: { type, userId: req.user.id }
      });

      res.json({
        success: true,
        data: { reactions },
        message: 'Reaction added successfully'
      });
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add reaction'
      });
    }
  }

  // Remove reaction from comment
  async removeReaction(req, res) {
    try {
      const { commentId, reactionType } = req.params;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const reactions = comment.reactions || {};
      if (reactions[reactionType]) {
        reactions[reactionType] = reactions[reactionType].filter(
          userId => userId !== req.user.id
        );
        if (reactions[reactionType].length === 0) {
          delete reactions[reactionType];
        }
      }

      await comment.update({ reactions });

      // Audit log
      await auditService.log('COMMENT_REACTION_REMOVED', req.user.id, {
        commentId,
        reactionType
      });

      // Socket notification
      socketService.notifyCard(comment.cardId, 'commentReactionRemoved', {
        commentId,
        reaction: { type: reactionType, userId: req.user.id }
      });

      res.json({
        success: true,
        data: { reactions },
        message: 'Reaction removed successfully'
      });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove reaction'
      });
    }
  }

  // Get comment history
  async getCommentHistory(req, res) {
    try {
      const { commentId } = req.params;

      // This would require an audit log or version history table
      // For now, return empty history
      res.json({
        success: true,
        data: { history: [] },
        message: 'Comment history retrieved successfully'
      });
    } catch (error) {
      console.error('Get comment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comment history'
      });
    }
  }

  // Resolve comment
  async resolveComment(req, res) {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      await comment.update({
        isResolved: true,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      });

      // Audit log
      await auditService.log('COMMENT_RESOLVED', req.user.id, {
        commentId
      });

      // Socket notification
      socketService.notifyCard(comment.cardId, 'commentResolved', {
        commentId,
        resolvedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Comment resolved successfully'
      });
    } catch (error) {
      console.error('Resolve comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve comment'
      });
    }
  }

  // Unresolve comment
  async unresolveComment(req, res) {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      await comment.update({
        isResolved: false,
        resolvedBy: null,
        resolvedAt: null
      });

      // Audit log
      await auditService.log('COMMENT_UNRESOLVED', req.user.id, {
        commentId
      });

      // Socket notification
      socketService.notifyCard(comment.cardId, 'commentUnresolved', {
        commentId,
        unresolvedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Comment unresolved successfully'
      });
    } catch (error) {
      console.error('Unresolve comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unresolve comment'
      });
    }
  }
}

module.exports = new CommentController();
