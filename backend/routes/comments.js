// routes/comments.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadCommentFiles, handleUploadErrors } = require('../middleware/upload');
const { 
  validateComment, 
  validateSearch, 
  validatePagination,
  validateObjectId 
} = require('../middleware/validation');

// Public routes
router.get('/:targetType/:targetId', optionalAuth, validateComment.slice(1), validatePagination, commentController.getComments);
router.get('/search', validateSearch, validatePagination, commentController.searchComments);
router.get('/thread/:commentId', validateObjectId('commentId'), commentController.getCommentThread);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/:targetType/:targetId', uploadCommentFiles, handleUploadErrors, validateComment, commentController.createComment);
router.put('/:commentId', validateObjectId('commentId'), commentController.updateComment);
router.delete('/:commentId', validateObjectId('commentId'), commentController.deleteComment);
router.post('/:commentId/like', validateObjectId('commentId'), commentController.toggleLike);
router.post('/:commentId/flag', validateObjectId('commentId'), commentController.flagComment);
router.get('/user/:userId', validateObjectId('userId'), validatePagination, commentController.getUserComments);

module.exports = router;