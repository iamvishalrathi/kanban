const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');

// Debug authController
console.log('authController:', authController);
console.log('authController.register:', typeof authController.register);

// Import middleware
const { authenticateToken: auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Simple test route first
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Try auth routes without validation first
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', auth, authController.logout);
router.post('/auth/refresh', authController.refreshToken);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
