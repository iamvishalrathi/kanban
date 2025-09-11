const express = require('express');
const router = express.Router();

// Import controllers - basic test
const authController = require('../controllers/authController');

console.log('authController keys:', Object.keys(authController));
console.log('logout method:', authController.logout);
console.log('register method:', authController.register);

// Basic routes without validation
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
