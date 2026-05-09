const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);

// Protected Route
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
