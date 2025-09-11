const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const boardRoutes = require('./boards');

// Use route modules
router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
