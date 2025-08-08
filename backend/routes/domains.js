const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { uploadDomainImage, handleUploadErrors } = require('../middleware/upload');
const { 
  validateDomain, 
  validateSearch, 
  validatePagination,
  validateObjectId 
} = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, validatePagination, domainController.getAllDomains);
router.get('/search', validateSearch, validatePagination, domainController.searchDomains);
router.get('/:domainId', optionalAuth, validateObjectId('domainId'), domainController.getDomainById);
router.get('/:domainId/topics', validateObjectId('domainId'), domainController.getDomainTopics);
router.get('/:domainId/stats', validateObjectId('domainId'), domainController.getDomainStats);

// Protected routes
router.post('/', authenticate, uploadDomainImage, handleUploadErrors, validateDomain, domainController.createDomain);
// ADD THIS LINE - the specific route your frontend is looking for
router.post('/domainForm', authenticate, uploadDomainImage, handleUploadErrors, validateDomain, domainController.createDomain);

router.put('/:domainId', authenticate, uploadDomainImage, handleUploadErrors, validateObjectId('domainId'), validateDomain, domainController.updateDomain);
router.delete('/:domainId', authenticate, validateObjectId('domainId'), domainController.deleteDomain);

// Legacy routes for compatibility
router.get('/domains', optionalAuth, validatePagination, domainController.getAllDomains);
router.post('/domainform', authenticate, uploadDomainImage, handleUploadErrors, validateDomain, domainController.createDomain);

module.exports = router;