// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadUserProfileImage, handleUploadErrors } = require('../middleware/upload');
const { 
  validateRegister, 
  validateLogin, 
  validateChangePassword,
  validateObjectId 
} = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', uploadUserProfileImage, handleUploadErrors, authController.updateProfile);
router.put('/password', validateChangePassword, authController.changePassword);
router.post('/logout', authController.logout);
router.get('/verify', authController.verifyToken);
router.post('/follow/:targetUserId', validateObjectId('targetUserId'), authController.toggleFollow);

// Public user profile (optional auth)
router.get('/user/:userId', optionalAuth, validateObjectId('userId'), authController.getUserById);

module.exports = router;

