// routes/authors.js
const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { uploadAuthorImage, handleUploadErrors } = require('../middleware/upload');
const { 
  validateAuthor, 
  validateSearch, 
  validatePagination,
  validateObjectId 
} = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, validatePagination, authorController.getAllAuthors);
router.get('/search', validateSearch, validatePagination, authorController.searchAuthors);
router.get('/top', authorController.getTopAuthors);
router.get('/research-area/:researchArea', validatePagination, authorController.getAuthorsByResearchArea);
router.get('/topic/:topic', authorController.getAuthorByTopic);
router.get('/:authorId', optionalAuth, validateObjectId('authorId'), authorController.getAuthorById);
router.get('/:authorId/collaboration', validateObjectId('authorId'), authorController.getAuthorCollaborationInfo);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/', uploadAuthorImage, handleUploadErrors, validateAuthor, authorController.createAuthor);
router.put('/:authorId', uploadAuthorImage, handleUploadErrors, validateObjectId('authorId'), authorController.updateAuthor);
router.delete('/:authorId', validateObjectId('authorId'), authorController.deleteAuthor);

// Admin only routes
router.post('/:authorId/verify', requireAdmin, validateObjectId('authorId'), authorController.verifyAuthor);

// Legacy routes for compatibility
router.post('/addauthor', uploadAuthorImage, handleUploadErrors, validateAuthor, authorController.createAuthor);
router.get('/authors', optionalAuth, validatePagination, authorController.getAllAuthors);
router.get('/authors/topic/:topic', authorController.getAuthorByTopic);

module.exports = router;
