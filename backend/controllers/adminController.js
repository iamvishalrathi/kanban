const { User, Board, BoardMember, Card, AuditLog } = require('../models');
const { Op } = require('sequelize');
const socketService = require('../services/socketService');
const auditService = require('../services/auditService');

class AdminController {
  // Get admin dashboard data
  async getDashboard(req, res) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalBoards,
        activeBoards,
        totalCards,
        recentActions
      ] = await Promise.all([
        User.count(),
        User.count({ where: { isActive: true } }),
        Board.count(),
        Board.count({ where: { isArchived: false } }),
        Card.count(),
        AuditLog.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ]
        })
      ]);

      const connectionStats = socketService.getConnectionStats();

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            activeUsers,
            totalBoards,
            activeBoards,
            totalCards,
            activeConnections: connectionStats.totalConnections
          },
          recentActions,
          connectionStats
        }
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data'
      });
    }
  }

  // Get all users
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 50, search, active } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      if (active !== undefined) {
        whereClause.isActive = active === 'true';
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
            totalPages: Math.ceil(users.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  // Ban user
  async banUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot ban admin users'
        });
      }

      await user.update({ isActive: false });

      // Disconnect user from all sockets
      socketService.disconnectUser(userId, 'Account banned by administrator');

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

  // Unban user
  async unbanUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ isActive: true });

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

  // Get all boards
  async getAllBoards(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const boards = await Board.findAndCountAll({
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
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
      console.error('Get all boards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get boards'
      });
    }
  }

  // Get audit logs
  async getAuditLogs(req, res) {
    try {
      const result = await auditService.getSystemAuditLogs(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit logs'
      });
    }
  }

  // Get system statistics
  async getSystemStats(req, res) {
    try {
      const stats = await auditService.getAuditStats(null, req.query.timeRange);
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system statistics'
      });
    }
  }
}

module.exports = new AdminController();
