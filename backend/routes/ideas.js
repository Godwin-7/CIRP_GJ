// routes/ideas.js
const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/ideaController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadIdeaFiles, handleUploadErrors } = require('../middleware/upload');
const { 
  validateIdea, 
  validateSearch, 
  validatePagination,
  validateObjectId 
} = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, validatePagination, ideaController.getAllIdeas);
router.get('/search', validateSearch, validatePagination, ideaController.searchIdeas);
router.get('/trending', ideaController.getTrendingIdeas);
router.get('/domain/:domainId', optionalAuth, validateObjectId('domainId'), validatePagination, ideaController.getIdeasByDomain);
router.get('/:ideaId', optionalAuth, validateObjectId('ideaId'), ideaController.getIdeaById);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/', uploadIdeaFiles, handleUploadErrors, validateIdea, ideaController.createIdea);
router.put('/:ideaId', uploadIdeaFiles, handleUploadErrors, validateObjectId('ideaId'), ideaController.updateIdea);
router.delete('/:ideaId', validateObjectId('ideaId'), ideaController.deleteIdea);
router.post('/:ideaId/like', validateObjectId('ideaId'), ideaController.toggleLike);
router.post('/:ideaId/collaborate', validateObjectId('ideaId'), ideaController.expressCollaborationInterest);
router.put('/:ideaId/collaborate/:interestId', validateObjectId('ideaId'), ideaController.manageCollaborationInterest);

// Legacy routes for compatibility
router.post('/addidea', uploadIdeaFiles, handleUploadErrors, validateIdea, ideaController.createIdea);
router.get('/domains/:domainId', optionalAuth, validateObjectId('domainId'), ideaController.getIdeasByDomain);
router.get('/domains/:domainId/ideas/:ideaId', optionalAuth, validateObjectId('domainId'), validateObjectId('ideaId'), ideaController.getIdeaById);

module.exports = router;
