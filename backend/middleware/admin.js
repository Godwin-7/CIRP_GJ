// middleware/admin.js
const User = require('../models/User');

// Check if user is admin
exports.requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user and check admin status
    const user = await User.findById(req.userId).select('isAdmin isActive');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    // Add admin flag to request for use in controllers
    req.isAdmin = true;
    next();

  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin verification'
    });
  }
};

// Check if user is admin or resource owner
exports.requireAdminOrOwner = (ownerIdField = 'createdBy') => {
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
        return next();
      }

      // If not admin, check if user is the owner
      // This will be validated in the controller where we have access to the resource
      req.isAdmin = false;
      req.ownerIdField = ownerIdField;
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

// Log admin actions for audit trail
exports.logAdminAction = (action) => {
  return (req, res, next) => {
    const originalEnd = res.end;
    
    res.end = function(...args) {
      // Log successful admin actions
      if (res.statusCode >= 200 && res.statusCode < 300 && req.isAdmin) {
        console.log(`[ADMIN ACTION] ${new Date().toISOString()} - User: ${req.userId}, Action: ${action}, Route: ${req.originalUrl}, Method: ${req.method}`);
      }
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
};

// Get admin users list (for super admin functionality)
exports.getAdminUsers = async (req, res) => {
  try {
    const adminUsers = await User.find({ isAdmin: true })
      .select('username email fullName isActive createdAt lastLogin')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        admins: adminUsers,
        count: adminUsers.length
      }
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Promote user to admin
exports.promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    user.isAdmin = true;
    await user.save();

    console.log(`[ADMIN PROMOTION] User ${user.username} (${user.email}) promoted to admin by ${req.userId}`);

    res.json({
      success: true,
      message: `User ${user.username} has been promoted to admin`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin
        }
      }
    });

  } catch (error) {
    console.error('Promote to admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Revoke admin privileges
exports.revokeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Prevent self-demotion
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot revoke your own admin privileges'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    user.isAdmin = false;
    await user.save();

    console.log(`[ADMIN REVOCATION] User ${user.username} (${user.email}) admin privileges revoked by ${req.userId}`);

    res.json({
      success: true,
      message: `Admin privileges revoked for user ${user.username}`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin
        }
      }
    });

  } catch (error) {
    console.error('Revoke admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};