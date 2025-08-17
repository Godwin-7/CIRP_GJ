const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    console.log('Auth header:', authHeader); // Debug log
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    console.log('Extracted token:', token ? 'Token present' : 'No token'); // Debug log
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', { userId: decoded.userId, email: decoded.email }); // Debug log
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.'
      });
    }

    // Add user info to request
    req.userId = decoded.userId;
    req.user = user;
    req.isAdmin = user.isAdmin; // Add admin flag for easy access
    
    console.log('Authentication successful for user:', user.username, 'Admin:', user.isAdmin); // Debug log
    next();

  } catch (error) {
    console.error('Authentication error:', error.message); // Debug log
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Optional authentication middleware
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without authentication
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next(); // No token, continue without authentication
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.userId = decoded.userId;
      req.user = user;
      req.isAdmin = user.isAdmin; // Add admin flag
    }
    
    next();

  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

// Admin authentication middleware
exports.requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    if (!req.userId) {
      // Apply authentication first
      return exports.authenticate(req, res, next);
    }
    
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during admin authentication.'
    });
  }
};

// Check if user is admin or resource owner
exports.requireAdminOrOwner = (resourceOwnerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await User.findById(req.userId).select('isAdmin isActive');
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user account'
        });
      }

      // If user is admin, allow access
      if (user.isAdmin) {
        req.isAdmin = true;
        req.user = user;
        return next();
      }

      // Store the field name for controller to check ownership
      req.resourceOwnerField = resourceOwnerField;
      req.user = user;
      next();

    } catch (error) {
      console.error('Admin or owner middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization'
      });
    }
  };
};

// Middleware to check if user can edit resource (admin or owner)
exports.canEditResource = (model, resourceIdParam = 'id', ownerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // If user is admin, allow
      if (req.user?.isAdmin) {
        req.canEdit = true;
        req.isResourceOwner = false;
        return next();
      }

      // Check if user owns the resource
      const resourceId = req.params[resourceIdParam];
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      const isOwner = resource[ownerField].toString() === req.userId;
      req.canEdit = isOwner;
      req.isResourceOwner = isOwner;
      req.resource = resource;

      if (!isOwner && !req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this resource'
        });
      }

      next();

    } catch (error) {
      console.error('Can edit resource middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization check'
      });
    }
  };
};

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  console.error('Global error handler:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // MongoDB cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID'
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};