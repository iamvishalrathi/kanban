const bcrypt = require('bcryptjs');
const { User, Board, Card, Comment, Notification, AuditLog } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

class UserController {
  // Get current user profile
  async getCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Board,
            as: 'ownedBoards',
            attributes: ['id', 'title', 'createdAt'],
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }

  // Update current user profile
  async updateCurrentUser(req, res) {
    try {
      const { firstName, lastName, username, bio, timezone, language } = req.body;
      const userId = req.user.id;

      // Check if username is taken by another user
      if (username) {
        const existingUser = await User.findOne({
          where: {
            username: username.toLowerCase(),
            id: { [Op.ne]: userId }
          }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken'
          });
        }
      }

      const [updatedRows] = await User.update({
        firstName,
        lastName,
        username: username?.toLowerCase(),
        bio,
        timezone,
        language,
        updatedAt: new Date()
      }, {
        where: { id: userId },
        returning: true
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      // Log the update
      await AuditLog.create({
        userId,
        action: 'UPDATE_PROFILE',
        resourceType: 'user',
        resourceId: userId,
        metadata: { updatedFields: Object.keys(req.body) }
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await User.update({
        password: hashedNewPassword,
        updatedAt: new Date()
      }, {
        where: { id: userId }
      });

      // Log password change
      await AuditLog.create({
        userId,
        action: 'CHANGE_PASSWORD',
        resourceType: 'user',
        resourceId: userId
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const userId = req.user.id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user's avatar URL
      await User.update({
        avatarUrl,
        updatedAt: new Date()
      }, {
        where: { id: userId }
      });

      // Log avatar upload
      await AuditLog.create({
        userId,
        action: 'UPLOAD_AVATAR',
        resourceType: 'user',
        resourceId: userId,
        metadata: { filename: req.file.filename }
      });

      res.json({
        success: true,
        data: { avatarUrl },
        message: 'Avatar uploaded successfully'
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar'
      });
    }
  }

  // Delete avatar
  async deleteAvatar(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete file if exists
      if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
        try {
          const filePath = path.join(__dirname, '..', 'public', user.avatarUrl);
          await fs.unlink(filePath);
        } catch (fileError) {
          console.warn('Failed to delete avatar file:', fileError.message);
        }
      }

      // Clear avatar URL
      await User.update({
        avatarUrl: null,
        updatedAt: new Date()
      }, {
        where: { id: userId }
      });

      res.json({
        success: true,
        message: 'Avatar deleted successfully'
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete avatar'
      });
    }
  }

  // Get user preferences
  async getUserPreferences(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['preferences', 'timezone', 'language', 'theme']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { preferences: user.preferences || {} }
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user preferences'
      });
    }
  }

  // Update user preferences
  async updateUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      const { preferences, timezone, language, theme } = req.body;

      await User.update({
        preferences: preferences || {},
        timezone,
        language,
        theme,
        updatedAt: new Date()
      }, {
        where: { id: userId }
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  }

  // Get user activity
  async getUserActivity(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { userId };
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const activities = await AuditLog.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          activities: activities.rows,
          pagination: {
            total: activities.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(activities.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user activity'
      });
    }
  }

  // Get notification settings
  async getNotificationSettings(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['notificationSettings']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const defaultSettings = {
        email: {
          cardAssigned: true,
          cardDue: true,
          boardInvite: true,
          comments: true,
          updates: false
        },
        push: {
          cardAssigned: true,
          cardDue: true,
          boardInvite: true,
          comments: false,
          updates: false
        },
        inApp: {
          cardAssigned: true,
          cardDue: true,
          boardInvite: true,
          comments: true,
          updates: true
        }
      };

      res.json({
        success: true,
        data: { 
          settings: user.notificationSettings || defaultSettings 
        }
      });
    } catch (error) {
      console.error('Get notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification settings'
      });
    }
  }

  // Update notification settings
  async updateNotificationSettings(req, res) {
    try {
      const userId = req.user.id;
      const { settings } = req.body;

      await User.update({
        notificationSettings: settings,
        updatedAt: new Date()
      }, {
        where: { id: userId }
      });

      res.json({
        success: true,
        message: 'Notification settings updated successfully'
      });
    } catch (error) {
      console.error('Update notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings'
      });
    }
  }

  // Get user boards summary
  async getUserBoardsSummary(req, res) {
    try {
      const userId = req.user.id;
      const { status = 'active' } = req.query;

      const whereClause = status === 'archived' 
        ? { archivedAt: { [Op.ne]: null } }
        : { archivedAt: null };

      const boards = await Board.findAll({
        where: {
          ...whereClause,
          [Op.or]: [
            { ownerId: userId },
            { '$members.userId$': userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'members',
            attributes: ['id'],
            through: { attributes: [] }
          }
        ],
        attributes: ['id', 'title', 'description', 'createdAt', 'updatedAt'],
        order: [['updatedAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { boards }
      });
    } catch (error) {
      console.error('Get user boards summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get boards summary'
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Get counts
      const [boardCount, cardCount, commentCount] = await Promise.all([
        Board.count({
          where: {
            ownerId: userId,
            ...dateFilter
          }
        }),
        Card.count({
          where: {
            [Op.or]: [
              { creatorId: userId },
              { assigneeId: userId }
            ],
            ...dateFilter
          }
        }),
        Comment.count({
          where: {
            userId,
            ...dateFilter
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            boardsCreated: boardCount,
            cardsAssigned: cardCount,
            commentsPosted: commentCount
          }
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics'
      });
    }
  }

  // Delete user account
  async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      // Get user with password for verification
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect password'
        });
      }

      // Delete user (this should cascade delete related data)
      await User.destroy({ where: { id: userId } });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }

  // Export user data
  async exportUserData(req, res) {
    try {
      const userId = req.user.id;

      const userData = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Board,
            as: 'ownedBoards',
            include: ['columns', 'cards']
          },
          {
            model: Card,
            as: 'createdCards'
          },
          {
            model: Comment,
            as: 'comments'
          }
        ]
      });

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
      
      res.json({
        success: true,
        data: userData,
        exportedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Export user data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export user data'
      });
    }
  }

  // Admin methods
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, status, role } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { username: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status) {
        if (status === 'banned') {
          whereClause.bannedAt = { [Op.ne]: null };
        } else if (status === 'active') {
          whereClause.bannedAt = null;
        }
      }

      if (role) {
        whereClause.role = role;
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            total: users.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(users.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  async getUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Board,
            as: 'ownedBoards',
            attributes: ['id', 'title', 'createdAt']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user'
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const [updatedRows] = await User.update(updateData, {
        where: { id: userId }
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  async banUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason, duration } = req.body;

      const banUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

      await User.update({
        bannedAt: new Date(),
        banReason: reason,
        banUntil,
        updatedAt: new Date()
      }, {
        where: { id: userId }
      });

      // Log ban action
      await AuditLog.create({
        userId: req.user.id,
        action: 'BAN_USER',
        resourceType: 'user',
        resourceId: userId,
        metadata: { reason, duration }
      });

      res.json({
        success: true,
        message: 'User banned successfully'
      });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ban user'
      });
    }
  }

  async unbanUser(req, res) {
    try {
      const { userId } = req.params;

      await User.update({
        bannedAt: null,
        banReason: null,
        banUntil: null,
        updatedAt: new Date()
      }, {
        where: { id: userId }
      });

      // Log unban action
      await AuditLog.create({
        userId: req.user.id,
        action: 'UNBAN_USER',
        resourceType: 'user',
        resourceId: userId
      });

      res.json({
        success: true,
        message: 'User unbanned successfully'
      });
    } catch (error) {
      console.error('Unban user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unban user'
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      await User.destroy({ where: { id: userId } });

      // Log deletion
      await AuditLog.create({
        userId: req.user.id,
        action: 'DELETE_USER',
        resourceType: 'user',
        resourceId: userId
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }

  async getUserActivityAdmin(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const activities = await AuditLog.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          activities: activities.rows,
          pagination: {
            total: activities.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(activities.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get user activity admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user activity'
      });
    }
  }
}

module.exports = new UserController();