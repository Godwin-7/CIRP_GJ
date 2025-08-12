// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

// User validation
exports.validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Full name cannot exceed 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number')
];

exports.validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// FIXED: Simplified domain validation that doesn't hang
exports.validateDomainBasic = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Domain title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['Technology', 'Biology', 'Physics', 'Chemistry', 'Mathematics', 'Engineering', 'Medicine', 'Environment', 'Other'])
    .withMessage('Invalid category'),
  
  // Basic topics validation - just check if it exists, let controller handle parsing
  body('topics')
    .notEmpty()
    .withMessage('Topics are required'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Keep the old complex validation for backward compatibility if needed
exports.validateDomain = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Domain title must be between 3 and 100 characters')
    .custom((value, { req }) => {
      console.log('Validating title:', value); // Debug log
      return true;
    }),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .custom((value, { req }) => {
      console.log('Validating description length:', value?.length); // Debug log
      return true;
    }),
  
  body('category')
    .optional()
    .isIn(['Technology', 'Biology', 'Physics', 'Chemistry', 'Mathematics', 'Engineering', 'Medicine', 'Environment', 'Other'])
    .withMessage('Invalid category'),
  
  body('topics')
    .custom((value, { req }) => {
      console.log('Validating topics:', typeof value, value); // Debug log
      
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        
        console.log('Parsed topics:', parsed); // Debug log
        
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Topics must be an object');
        }
        
        // Check if all required arrays exist
        if (!parsed.hasOwnProperty('easy') || !parsed.hasOwnProperty('medium') || !parsed.hasOwnProperty('hard')) {
          throw new Error('Topics must contain easy, medium, and hard properties');
        }
        
        // Check if they are arrays
        if (!Array.isArray(parsed.easy) || !Array.isArray(parsed.medium) || !Array.isArray(parsed.hard)) {
          throw new Error('Topics easy, medium, and hard must be arrays');
        }
        
        // Check if at least one array has content
        const totalTopics = parsed.easy.length + parsed.medium.length + parsed.hard.length;
        if (totalTopics === 0) {
          throw new Error('At least one topic must be provided in any difficulty level');
        }
        
        console.log('Topics validation passed. Total topics:', totalTopics); // Debug log
        return true;
        
      } catch (error) {
        console.error('Topics validation error:', error.message); // Debug log
        throw new Error(`Invalid topics format: ${error.message}`);
      }
    }),
  
  // Middleware to handle validation results
  (req, res, next) => {
    console.log('Domain validation - Request body:', {
      title: req.body.title,
      description: req.body.description?.substring(0, 50) + '...',
      topics: typeof req.body.topics,
      hasFile: !!req.file
    }); // Debug log
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array()); // Debug log
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Idea validation
exports.validateIdea = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Idea title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  
  body('domainId')
    .isMongoId()
    .withMessage('Invalid domain ID'),
  
  body('authorId')
    .isMongoId()
    .withMessage('Invalid author ID'),
  
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  
  body('category')
    .optional()
    .isIn(['Research', 'Development', 'Innovation', 'Improvement', 'Analysis', 'Other'])
    .withMessage('Invalid category')
];

// Author validation
exports.validateAuthor = [
  body('authorName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('authorEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number')
];

// Comment validation
exports.validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),
  
  param('targetType')
    .isIn(['idea', 'domain'])
    .withMessage('Invalid target type'),
  
  param('targetId')
    .isMongoId()
    .withMessage('Invalid target ID')
];

// Search validation
exports.validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

// Pagination validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// MongoDB ObjectId validation
exports.validateObjectId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field}`)
];