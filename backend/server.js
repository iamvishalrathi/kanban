const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import models and services
const { sequelize } = require('./models');
const redisService = require('./services/redisService');
const socketService = require('./services/socketService');
const { initializeRateLimiters } = require('./middleware/rateLimiter');

// Import routes
const apiRoutes = require('./routes/index');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize socket service
socketService.initialize(io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
  credentials: true
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api', apiRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Database validation error',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      field: err.errors[0]?.path
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize services and start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log('🚀 Starting server initialization...');
    console.log('🌐 Network diagnostics:');
    console.log(`   - Node.js version: ${process.version}`);
    console.log(`   - Environment: ${process.env.NODE_ENV}`);
    console.log(`   - Platform: ${process.platform}`);

    // Initialize rate limiters
    await initializeRateLimiters();
    console.log('Rate limiters initialized');

    // Connect to Redis (non-blocking for server startup)
    console.log('🔄 Attempting Redis connection...');
    try {
      await redisService.connect();
      console.log('✅ Connected to Redis');
    } catch (redisError) {
      console.warn('🟡 Redis connection failed, continuing without Redis:', redisError.message);
      if (redisError.message.includes('EAI_AGAIN')) {
        console.log('💡 Tip: EAI_AGAIN usually indicates DNS timeout - check your network connection');
      }
    }

    // Connect to database with improved retry logic
    let dbConnected = false;
    let dbRetries = 0;
    const maxDbRetries = 5; // Increased retries

    while (!dbConnected && dbRetries < maxDbRetries) {
      try {
        // Set longer timeout for database connection
        await Promise.race([
          sequelize.authenticate(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database connection timeout')), 20000)
          )
        ]);

        console.log('✅ Database connected');
        dbConnected = true;

        // Sync database models only if connected
        if (process.env.NODE_ENV === 'development') {
          await sequelize.sync({ logging: false });
          console.log('✅ Database synchronized');
        }

      } catch (dbError) {
        dbRetries++;
        console.warn(`🟡 Database connection attempt ${dbRetries}/${maxDbRetries} failed:`, dbError.message);

        if (dbRetries < maxDbRetries) {
          const waitTime = Math.min(dbRetries * 3000, 10000); // Progressive delay: 3s, 6s, 9s, 10s, 10s
          console.log(`🔄 Retrying database connection in ${waitTime / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error('🔴 Failed to connect to database after all retries');
          console.log('🟡 Server will start without database (limited functionality)');
          console.log('🔧 Troubleshooting: Check if Supabase instance is active and network is stable');
        }
      }
    }

    // Start server regardless of database connection status
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔌 Socket.IO enabled for real-time features`);

      if (dbConnected) {
        console.log(`✅ Full functionality available (Database + Redis)`);
      } else {
        console.log(`🟡 Limited functionality (Database connection failed)`);
        console.log(`   - Try restarting once your network/database is available`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('🔴 Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await redisService.disconnect();
      console.log('Redis disconnected');

      await sequelize.close();
      console.log('Database connection closed');

      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();
