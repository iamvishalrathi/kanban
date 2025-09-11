const { Notification, User, Board, Card } = require('../models');
const emailService = require('./emailService');
const redisService = require('./redisService');

class NotificationService {
  // Create a notification
  async createNotification({
    type,
    title,
    message,
    recipientId,
    triggeredById = null,
    boardId = null,
    cardId = null,
    data = {},
    sendEmail = false
  }) {
    try {
      const notification = await Notification.create({
        type,
        title,
        message,
        data,
        recipientId,
        triggeredById,
        boardId,
        cardId
      });

      // Send real-time notification via WebSocket
      await this.sendRealTimeNotification(recipientId, notification);

      // Send email if requested and user preferences allow
      if (sendEmail) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send real-time notification via WebSocket
  async sendRealTimeNotification(recipientId, notification) {
    try {
      const io = global.io;
      if (io) {
        // Send to specific user across all their socket connections
        io.to(`user:${recipientId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt,
          isRead: notification.isRead
        });
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      const recipient = await User.findByPk(notification.recipientId);
      if (!recipient) return;

      let emailSent = false;

      switch (notification.type) {
        case 'card_assigned':
          if (notification.cardId && notification.triggeredById) {
            const [card, board, assignedBy] = await Promise.all([
              Card.findByPk(notification.cardId, {
                include: [{ model: User, as: 'assignee' }]
              }),
              Board.findByPk(notification.boardId),
              User.findByPk(notification.triggeredById)
            ]);

            if (card && board && assignedBy) {
              const result = await emailService.sendCardAssignmentEmail(
                recipient, card, board, assignedBy
              );
              emailSent = result.success;
            }
          }
          break;

        case 'card_due_soon':
          if (notification.cardId) {
            const [card, board] = await Promise.all([
              Card.findByPk(notification.cardId),
              Board.findByPk(notification.boardId)
            ]);

            if (card && board) {
              const result = await emailService.sendCardDueSoonEmail(
                recipient, card, board
              );
              emailSent = result.success;
            }
          }
          break;

        case 'card_overdue':
          if (notification.cardId) {
            const [card, board] = await Promise.all([
              Card.findByPk(notification.cardId),
              Board.findByPk(notification.boardId)
            ]);

            if (card && board) {
              const result = await emailService.sendCardOverdueEmail(
                recipient, card, board
              );
              emailSent = result.success;
            }
          }
          break;

        case 'mentioned':
          if (notification.data.commentId && notification.triggeredById) {
            const [card, board, author] = await Promise.all([
              Card.findByPk(notification.cardId),
              Board.findByPk(notification.boardId),
              User.findByPk(notification.triggeredById)
            ]);

            if (card && board && author) {
              const comment = { content: notification.data.commentContent };
              const result = await emailService.sendMentionEmail(
                recipient, comment, card, board, author
              );
              emailSent = result.success;
            }
          }
          break;

        case 'board_invited':
          if (notification.triggeredById) {
            const [board, invitedBy] = await Promise.all([
              Board.findByPk(notification.boardId),
              User.findByPk(notification.triggeredById)
            ]);

            if (board && invitedBy) {
              const result = await emailService.sendBoardInvitationEmail(
                recipient, board, invitedBy, notification.data.role || 'viewer'
              );
              emailSent = result.success;
            }
          }
          break;
      }

      // Update notification with email status
      if (emailSent) {
        await notification.update({
          emailSent: true,
          emailSentAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Card assignment notification
  async notifyCardAssignment(cardId, assigneeId, assignedById) {
    try {
      const card = await Card.findByPk(cardId, {
        include: [
          { model: User, as: 'assignee' },
          {
            model: Column,
            as: 'column',
            include: [{ model: Board, as: 'board' }]
          }
        ]
      });

      if (!card || !card.assignee || assigneeId === assignedById) return;

      await this.createNotification({
        type: 'card_assigned',
        title: 'Card Assigned',
        message: `You've been assigned to "${card.title}"`,
        recipientId: assigneeId,
        triggeredById: assignedById,
        boardId: card.column.board.id,
        cardId: cardId,
        data: {
          cardTitle: card.title,
          boardTitle: card.column.board.title
        },
        sendEmail: true
      });
    } catch (error) {
      console.error('Error notifying card assignment:', error);
    }
  }

  // Card mention notification
  async notifyMention(mentionedUserIds, commentContent, cardId, authorId) {
    try {
      const card = await Card.findByPk(cardId, {
        include: [
          {
            model: Column,
            as: 'column',
            include: [{ model: Board, as: 'board' }]
          }
        ]
      });

      if (!card) return;

      const mentionPromises = mentionedUserIds
        .filter(userId => userId !== authorId) // Don't notify the author
        .map(userId =>
          this.createNotification({
            type: 'mentioned',
            title: 'You were mentioned',
            message: `You were mentioned in "${card.title}"`,
            recipientId: userId,
            triggeredById: authorId,
            boardId: card.column.board.id,
            cardId: cardId,
            data: {
              commentContent: commentContent.substring(0, 200),
              cardTitle: card.title,
              boardTitle: card.column.board.title
            },
            sendEmail: true
          })
        );

      await Promise.all(mentionPromises);
    } catch (error) {
      console.error('Error notifying mentions:', error);
    }
  }

  // Board invitation notification
  async notifyBoardInvitation(boardId, invitedUserId, invitedById, role) {
    try {
      const board = await Board.findByPk(boardId);
      if (!board || invitedUserId === invitedById) return;

      await this.createNotification({
        type: 'board_invited',
        title: 'Board Invitation',
        message: `You've been invited to join "${board.title}"`,
        recipientId: invitedUserId,
        triggeredById: invitedById,
        boardId: boardId,
        data: {
          boardTitle: board.title,
          role: role
        },
        sendEmail: true
      });
    } catch (error) {
      console.error('Error notifying board invitation:', error);
    }
  }

  // Card moved notification
  async notifyCardMoved(cardId, movedById, fromColumnTitle, toColumnTitle) {
    try {
      const card = await Card.findByPk(cardId, {
        include: [
          { model: User, as: 'assignee' },
          {
            model: Column,
            as: 'column',
            include: [{ model: Board, as: 'board' }]
          }
        ]
      });

      if (!card || !card.assignee || card.assigneeId === movedById) return;

      await this.createNotification({
        type: 'card_moved',
        title: 'Card Moved',
        message: `"${card.title}" was moved from ${fromColumnTitle} to ${toColumnTitle}`,
        recipientId: card.assigneeId,
        triggeredById: movedById,
        boardId: card.column.board.id,
        cardId: cardId,
        data: {
          cardTitle: card.title,
          fromColumn: fromColumnTitle,
          toColumn: toColumnTitle,
          boardTitle: card.column.board.title
        }
      });
    } catch (error) {
      console.error('Error notifying card move:', error);
    }
  }

  // Due date notifications
  async checkDueDateNotifications() {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find cards due soon (within 24 hours)
      const cardsDueSoon = await Card.findAll({
        where: {
          dueDate: {
            [Op.gte]: now,
            [Op.lte]: tomorrow
          },
          assigneeId: {
            [Op.not]: null
          }
        },
        include: [
          { model: User, as: 'assignee' },
          {
            model: Column,
            as: 'column',
            include: [{ model: Board, as: 'board' }]
          }
        ]
      });

      // Find overdue cards
      const overdueCards = await Card.findAll({
        where: {
          dueDate: {
            [Op.lt]: now
          },
          assigneeId: {
            [Op.not]: null
          }
        },
        include: [
          { model: User, as: 'assignee' },
          {
            model: Column,
            as: 'column',
            include: [{ model: Board, as: 'board' }]
          }
        ]
      });

      // Send due soon notifications
      for (const card of cardsDueSoon) {
        // Check if we already sent a notification for this card recently
        const existingNotification = await Notification.findOne({
          where: {
            type: 'card_due_soon',
            cardId: card.id,
            recipientId: card.assigneeId,
            createdAt: {
              [Op.gte]: new Date(now.getTime() - 12 * 60 * 60 * 1000) // Last 12 hours
            }
          }
        });

        if (!existingNotification) {
          await this.createNotification({
            type: 'card_due_soon',
            title: 'Card Due Soon',
            message: `"${card.title}" is due soon`,
            recipientId: card.assigneeId,
            boardId: card.column.board.id,
            cardId: card.id,
            data: {
              cardTitle: card.title,
              dueDate: card.dueDate,
              boardTitle: card.column.board.title
            },
            sendEmail: true
          });
        }
      }

      // Send overdue notifications
      for (const card of overdueCards) {
        // Check if we already sent an overdue notification for this card recently
        const existingNotification = await Notification.findOne({
          where: {
            type: 'card_overdue',
            cardId: card.id,
            recipientId: card.assigneeId,
            createdAt: {
              [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });

        if (!existingNotification) {
          await this.createNotification({
            type: 'card_overdue',
            title: 'Card Overdue',
            message: `"${card.title}" is overdue`,
            recipientId: card.assigneeId,
            boardId: card.column.board.id,
            cardId: card.id,
            data: {
              cardTitle: card.title,
              dueDate: card.dueDate,
              boardTitle: card.column.board.title
            },
            sendEmail: true
          });
        }
      }

      console.log(`Processed ${cardsDueSoon.length} due soon and ${overdueCards.length} overdue cards`);
    } catch (error) {
      console.error('Error checking due date notifications:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          recipientId: userId
        }
      });

      if (notification && !notification.isRead) {
        await notification.update({
          isRead: true,
          readAt: new Date()
        });

        // Send real-time update
        const io = global.io;
        if (io) {
          io.to(`user:${userId}`).emit('notification:read', { id: notificationId });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      await Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            recipientId: userId,
            isRead: false
          }
        }
      );

      // Send real-time update
      const io = global.io;
      if (io) {
        io.to(`user:${userId}`).emit('notifications:all_read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, { page = 1, limit = 50, unreadOnly = false } = {}) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = { recipientId: userId };

      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const notifications = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'triggeredBy',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Board,
            as: 'board',
            attributes: ['id', 'title']
          },
          {
            model: Card,
            as: 'card',
            attributes: ['id', 'title']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        notifications: notifications.rows,
        total: notifications.count,
        page,
        totalPages: Math.ceil(notifications.count / limit),
        hasMore: offset + notifications.rows.length < notifications.count
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          recipientId: userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }
}

module.exports = new NotificationService();
