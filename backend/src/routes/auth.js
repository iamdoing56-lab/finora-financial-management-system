const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Authentication Endpoints (/api/auth)
 */

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require valid JWT)
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
