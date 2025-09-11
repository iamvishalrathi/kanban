const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const boardController = require('../controllers/boardController');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Basic board routes (simplified for now)
router.get('/boards', (req, res) => {
  // Return empty boards for now
  res.json({
    success: true,
    data: {
      boards: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
