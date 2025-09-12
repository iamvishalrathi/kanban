const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const boardRoutes = require('./boards');
const boardMemberRoutes = require('./boardMembers');
const cardRoutes = require('./cards');
const templateRoutes = require('./templates');
const notificationRoutes = require('./notifications');

// Use route modules
router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/boards', boardMemberRoutes);
router.use('/cards', cardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', templateRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Warmup endpoint to prevent cold starts
router.get('/warmup', (req, res) => {
  const startTime = Date.now();
  
  // Perform lightweight operations to warm up the instance
  const warmupTasks = [
    // Test database connection
    require('../models').sequelize.authenticate(),
    // Test Redis connection if available
    require('../services/redisService').ping().catch(() => null),
  ];
  
  Promise.allSettled(warmupTasks).then(() => {
    const duration = Date.now() - startTime;
    res.json({
      status: 'warmed-up',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      message: 'Instance is now warm and ready to serve requests'
    });
  });
});

// Ping endpoint for simple health checks
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

module.exports = router;
