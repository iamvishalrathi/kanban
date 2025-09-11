const jwt = require('jsonwebtoken');
const { User, BoardMember } = require('../models');
const redisService = require('./redisService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // socketId -> user info
  }

  initialize(io) {
    this.io = io;
    global.io = io; // Make io globally available for other services

    io.use(this.authenticateSocket.bind(this));
    
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      this.handleConnection(socket);
    });

    return io;
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatar', 'isActive']
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;

    // Store user connection info
    this.connectedUsers.set(socket.id, {
      userId,
      user,
      connectedAt: new Date(),
      currentBoard: null
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Handle board joining
    socket.on('join:board', async (data) => {
      await this.handleJoinBoard(socket, data);
    });

    // Handle board leaving
    socket.on('leave:board', async (data) => {
      await this.handleLeaveBoard(socket, data);
    });

    // Handle typing indicators
    socket.on('typing:start', async (data) => {
      await this.handleTypingStart(socket, data);
    });

    socket.on('typing:stop', async (data) => {
      await this.handleTypingStop(socket, data);
    });

    // Handle card editing locks
    socket.on('card:edit:start', async (data) => {
      await this.handleCardEditStart(socket, data);
    });

    socket.on('card:edit:end', async (data) => {
      await this.handleCardEditEnd(socket, data);
    });

    // Handle optimistic updates acknowledgment
    socket.on('optimistic:ack', (data) => {
      this.handleOptimisticAck(socket, data);
    });

    // Handle cursor position updates
    socket.on('cursor:update', async (data) => {
      await this.handleCursorUpdate(socket, data);
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      await this.handleDisconnection(socket);
    });

    // Admin events
    if (user.role === 'admin') {
      socket.join('admin');
    }

    console.log(`User ${user.firstName} ${user.lastName} connected via socket ${socket.id}`);
  }

  async handleJoinBoard(socket, data) {
    try {
      const { boardId } = data;
      const userId = socket.userId;
      const user = socket.user;

      // Verify user has access to the board
      const membership = await BoardMember.findOne({
        where: { boardId, userId, isActive: true }
      });

      if (!membership) {
        socket.emit('error', { message: 'Access denied to board' });
        return;
      }

      // Leave previous board if any
      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo?.currentBoard) {
        await this.handleLeaveBoard(socket, { boardId: userInfo.currentBoard });
      }

      // Join board room
      socket.join(`board:${boardId}`);
      
      // Update user info
      userInfo.currentBoard = boardId;
      this.connectedUsers.set(socket.id, userInfo);

      // Update presence in Redis
      await redisService.setUserPresence(boardId, userId, {
        id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        socketId: socket.id,
        role: membership.role
      });

      // Get current board presence
      const boardPresence = await redisService.getBoardPresence(boardId);
      
      // Notify others in the board
      socket.to(`board:${boardId}`).emit('presence:user_joined', {
        user: {
          id: userId,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: membership.role
        },
        timestamp: new Date()
      });

      // Send current presence to the joining user
      socket.emit('presence:current', {
        users: Object.values(boardPresence),
        timestamp: new Date()
      });

      console.log(`User ${user.firstName} joined board ${boardId}`);
    } catch (error) {
      console.error('Error handling join board:', error);
      socket.emit('error', { message: 'Failed to join board' });
    }
  }

  async handleLeaveBoard(socket, data) {
    try {
      const { boardId } = data;
      const userId = socket.userId;
      const user = socket.user;

      // Leave board room
      socket.leave(`board:${boardId}`);

      // Remove presence from Redis
      await redisService.removeUserPresence(boardId, userId);

      // Update user info
      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo) {
        userInfo.currentBoard = null;
        this.connectedUsers.set(socket.id, userInfo);
      }

      // Notify others in the board
      socket.to(`board:${boardId}`).emit('presence:user_left', {
        userId,
        timestamp: new Date()
      });

      console.log(`User ${user.firstName} left board ${boardId}`);
    } catch (error) {
      console.error('Error handling leave board:', error);
    }
  }

  async handleTypingStart(socket, data) {
    try {
      const { boardId, cardId } = data;
      const userId = socket.userId;

      // Update typing indicator in Redis
      await redisService.setTypingIndicator(boardId, cardId, userId, true);

      // Notify others in the board
      socket.to(`board:${boardId}`).emit('typing:start', {
        userId,
        cardId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  }

  async handleTypingStop(socket, data) {
    try {
      const { boardId, cardId } = data;
      const userId = socket.userId;

      // Remove typing indicator from Redis
      await redisService.setTypingIndicator(boardId, cardId, userId, false);

      // Notify others in the board
      socket.to(`board:${boardId}`).emit('typing:stop', {
        userId,
        cardId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  }

  async handleCardEditStart(socket, data) {
    try {
      const { boardId, cardId } = data;
      const userId = socket.userId;

      // Try to acquire lock for card editing
      const lockValue = await redisService.acquireLock(`card:${cardId}`, userId, 300000); // 5 minutes

      if (lockValue) {
        // Lock acquired successfully
        socket.emit('card:edit:locked', { cardId, lockValue });
        
        // Notify others that this card is being edited
        socket.to(`board:${boardId}`).emit('card:edit:locked_by_other', {
          cardId,
          userId,
          timestamp: new Date()
        });
      } else {
        // Lock not available
        socket.emit('card:edit:lock_failed', { 
          cardId, 
          message: 'Card is currently being edited by another user' 
        });
      }
    } catch (error) {
      console.error('Error handling card edit start:', error);
    }
  }

  async handleCardEditEnd(socket, data) {
    try {
      const { boardId, cardId, lockValue } = data;

      // Release the lock
      await redisService.releaseLock(`card:${cardId}`, lockValue);

      // Notify others that editing has ended
      socket.to(`board:${boardId}`).emit('card:edit:unlocked', {
        cardId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling card edit end:', error);
    }
  }

  handleOptimisticAck(socket, data) {
    // Handle acknowledgment of optimistic updates
    const { updateId, success, error } = data;
    
    if (success) {
      console.log(`Optimistic update ${updateId} confirmed`);
    } else {
      console.error(`Optimistic update ${updateId} failed:`, error);
      // Could implement rollback logic here
    }
  }

  async handleCursorUpdate(socket, data) {
    try {
      const { boardId, position, element } = data;
      const userId = socket.userId;

      // Broadcast cursor position to others in the board
      socket.to(`board:${boardId}`).emit('cursor:update', {
        userId,
        position,
        element,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling cursor update:', error);
    }
  }

  async handleDisconnection(socket) {
    try {
      const userInfo = this.connectedUsers.get(socket.id);
      
      if (userInfo) {
        const { userId, currentBoard } = userInfo;

        // Clean up presence
        if (currentBoard) {
          await redisService.removeUserPresence(currentBoard, userId);
          
          // Notify others in the board
          socket.to(`board:${currentBoard}`).emit('presence:user_left', {
            userId,
            timestamp: new Date()
          });
        }

        // Release any locks held by this user
        // Note: This is a simplified approach. In production, you might want to track locks per user
        
        // Remove from connected users
        this.connectedUsers.delete(socket.id);

        console.log(`User ${userInfo.user.firstName} disconnected from socket ${socket.id}`);
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }

  // Broadcast methods for other services to use
  broadcastToBoard(boardId, event, data) {
    if (this.io) {
      this.io.to(`board:${boardId}`).emit(event, data);
    }
  }

  broadcastToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  broadcastToAdmins(event, data) {
    if (this.io) {
      this.io.to('admin').emit(event, data);
    }
  }

  // Real-time board updates
  broadcastBoardUpdate(boardId, updateType, data) {
    this.broadcastToBoard(boardId, 'board:update', {
      type: updateType,
      data,
      timestamp: new Date()
    });
  }

  broadcastColumnUpdate(boardId, columnId, updateType, data) {
    this.broadcastToBoard(boardId, 'column:update', {
      type: updateType,
      columnId,
      data,
      timestamp: new Date()
    });
  }

  broadcastCardUpdate(boardId, cardId, updateType, data) {
    this.broadcastToBoard(boardId, 'card:update', {
      type: updateType,
      cardId,
      data,
      timestamp: new Date()
    });
  }

  // Get statistics for admin panel
  getConnectionStats() {
    const stats = {
      totalConnections: this.connectedUsers.size,
      userConnections: {},
      boardConnections: {}
    };

    for (const [socketId, userInfo] of this.connectedUsers) {
      const userId = userInfo.userId;
      
      // Count connections per user
      if (!stats.userConnections[userId]) {
        stats.userConnections[userId] = 0;
      }
      stats.userConnections[userId]++;

      // Count connections per board
      if (userInfo.currentBoard) {
        const boardId = userInfo.currentBoard;
        if (!stats.boardConnections[boardId]) {
          stats.boardConnections[boardId] = 0;
        }
        stats.boardConnections[boardId]++;
      }
    }

    return stats;
  }

  // Force disconnect a user (for admin purposes)
  disconnectUser(userId, reason = 'Administrative action') {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('force:disconnect', { reason });
      
      // Find and disconnect all sockets for this user
      for (const [socketId, userInfo] of this.connectedUsers) {
        if (userInfo.userId === userId) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      }
    }
  }
}

module.exports = new SocketService();
