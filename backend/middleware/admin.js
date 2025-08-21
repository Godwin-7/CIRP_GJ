// middleware/admin.js - Enhanced with user deletion functionality
const User = require('../models/User');
const Domain = require('../models/Domain');
const Idea = require('../models/Idea');

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

// NEW: Delete user function (soft or hard delete)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { hardDelete = false } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Prevent self-deletion
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (hardDelete === 'true') {
      // Hard delete - remove completely from database
      console.log(`[ADMIN HARD DELETE] Starting hard delete for user: ${user.username}`);
      
      // Get counts before deletion for logging
      const [domainsCount, ideasCount] = await Promise.all([
        Domain.countDocuments({ createdBy: userId }),
        Idea.countDocuments({ createdBy: userId })
      ]);

      // Delete all user's content
      await Promise.all([
        Domain.deleteMany({ createdBy: userId }),
        Idea.deleteMany({ createdBy: userId })
      ]);

      // Delete the user from database
      await User.findByIdAndDelete(userId);

      console.log(`[ADMIN HARD DELETE] User ${user.username} and all content permanently deleted by admin ${req.userId}`);
      console.log(`[ADMIN HARD DELETE] Deleted: ${domainsCount} domains, ${ideasCount} ideas`);

      res.json({
        success: true,
        message: `User "${user.username}" and all associated content have been permanently deleted from the database`,
        data: {
          deletedUser: {
            username: user.username,
            email: user.email
          },
          deletedContent: {
            domains: domainsCount,
            ideas: ideasCount
          }
        }
      });

    } else {
      // Soft delete - deactivate account
      user.isActive = false;
      await user.save();

      console.log(`[ADMIN SOFT DELETE] User ${user.username} deactivated by admin ${req.userId}`);

      res.json({
        success: true,
        message: `User "${user.username}" has been deactivated`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isActive: user.isActive
          }
        }
      });
    }

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// NEW: Get all users with enhanced filtering (not just admins)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status,
      isAdmin,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { fullName: searchRegex }
      ];
    }
    
    if (status) {
      filter.isActive = status === 'active';
    }
    
    if (isAdmin !== undefined) {
      filter.isAdmin = isAdmin === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(filter)
      .select('username email fullName profileImage isActive isAdmin createdAt lastLogin phone bio')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);

    // Add stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [domainsCount, ideasCount] = await Promise.all([
          Domain.countDocuments({ createdBy: user._id }),
          Idea.countDocuments({ createdBy: user._id })
        ]);

        return {
          ...user.toObject(),
          stats: {
            domainsCreated: domainsCount,
            ideasCreated: ideasCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: users.length,
          totalItems: total
        },
        filters: {
          search,
          status,
          isAdmin,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// NEW: Bulk user operations
exports.bulkUserOperation = async (req, res) => {
  try {
    const { userIds, operation } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!['activate', 'deactivate', 'delete', 'promote', 'demote'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation'
      });
    }

    // Prevent operations on current admin user
    if (userIds.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot perform bulk operations on your own account'
      });
    }

    const results = {
      success: [],
      failed: [],
      operation
    };

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        
        if (!user) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }

        switch (operation) {
          case 'activate':
            user.isActive = true;
            await user.save();
            results.success.push({ userId, username: user.username });
            break;

          case 'deactivate':
            user.isActive = false;
            await user.save();
            results.success.push({ userId, username: user.username });
            break;

          case 'delete':
            await User.findByIdAndDelete(userId);
            results.success.push({ userId, username: user.username });
            break;

          case 'promote':
            if (!user.isAdmin) {
              user.isAdmin = true;
              await user.save();
              results.success.push({ userId, username: user.username });
            } else {
              results.failed.push({ userId, error: 'User is already admin' });
            }
            break;

          case 'demote':
            if (user.isAdmin) {
              user.isAdmin = false;
              await user.save();
              results.success.push({ userId, username: user.username });
            } else {
              results.failed.push({ userId, error: 'User is not admin' });
            }
            break;
        }

      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }

    console.log(`[ADMIN BULK OPERATION] ${operation} performed by admin ${req.userId}:`, results);

    res.json({
      success: true,
      message: `Bulk ${operation} operation completed`,
      data: results
    });

  } catch (error) {
    console.error('Bulk user operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk operation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// NEW: Get user activity/audit log
exports.getUserActivityLog = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId).select('username email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's domains and ideas with timestamps
    const [domains, ideas] = await Promise.all([
      Domain.find({ createdBy: userId })
        .select('title createdAt updatedAt isActive')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit)),
      Idea.find({ createdBy: userId })
        .select('title createdAt updatedAt isActive')
        .populate('domain', 'title')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
    ]);

    // Combine and sort activities
    const activities = [
      ...domains.map(domain => ({
        type: 'domain',
        action: 'created',
        title: domain.title,
        timestamp: domain.createdAt,
        isActive: domain.isActive
      })),
      ...ideas.map(idea => ({
        type: 'idea',
        action: 'created',
        title: idea.title,
        domainTitle: idea.domain?.title,
        timestamp: idea.createdAt,
        isActive: idea.isActive
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        },
        activities: activities.slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit)),
        summary: {
          totalDomains: domains.length,
          activeDomains: domains.filter(d => d.isActive).length,
          totalIdeas: ideas.length,
          activeIdeas: ideas.filter(i => i.isActive).length
        },
        pagination: {
          current: parseInt(page),
          total: Math.ceil(activities.length / parseInt(limit)),
          count: Math.min(parseInt(limit), activities.length)
        }
      }
    });

  } catch (error) {
    console.error('Get user activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};