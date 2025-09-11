const express = require('express');
const authController = require('../controllers/authController');
const { validate, validateParams, schemas } = require('../middleware/validation');
const { authRateLimit } = require('../middleware/rateLimit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', 
  authRateLimit,
  validate(schemas.register),
  authController.register
);

router.post('/login',
  authRateLimit,
  validate(schemas.login),
  authController.login
);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', authController.getProfile);

router.put('/profile',
  validate(schemas.updateProfile),
  authController.updateProfile
);

router.put('/password',
  validate(schemas.changePassword),
  authController.changePassword
);

router.post('/refresh', authController.refreshToken);

router.post('/logout', authController.logout);

router.get('/search',
  authController.searchUsers
);

router.get('/users/:id',
  validateParams(schemas.uuidParam),
  authController.getUserById
);

router.delete('/deactivate', authController.deactivateAccount);

module.exports = router;
