// routes/admin.js - Enhanced with improved search functionality and data fetching
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  requireAdmin, 
  logAdminAction, 
  getAdminUsers, 
  promoteToAdmin, 
  revokeAdmin,
  deleteUser
} = require('../middleware/admin');
const { validateObjectId } = require('../middleware/validation');

// Domain and Idea controllers for admin actions
const domainController = require('../controllers/domainController');
const ideaController = require('../controllers/ideaController');
const User = require('../models/User');
const Domain = require('../models/Domain');
const Idea = require('../models/Idea');

// All admin routes require authentication
router.use(authenticate);

// Admin user management routes
router.get('/users', requireAdmin, getAdminUsers);

// Enhanced: Get ALL users (not just admins) with improved pagination and search
router.get('/users/all', requireAdmin, async (req, res) => {
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

    console.log('Admin users/all request:', { page, limit, search, status, isAdmin });

    // Build filter
    const filter = {};
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
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

    console.log('User search filter:', JSON.stringify(filter));

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('username email fullName profileImage isActive isAdmin createdAt lastLogin phone bio')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Use lean for better performance

    const total = await User.countDocuments(filter);

    console.log(`Found ${users.length} users out of ${total} total`);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: users.length,
          totalItems: total
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
});

// Enhanced: Delete user (soft or hard delete)
router.delete('/users/:userId', 
  requireAdmin, 
  logAdminAction('DELETE_USER'),
  validateObjectId('userId'), 
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { hardDelete = false } = req.query;

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
        // Hard delete - remove from database completely
        // First, get counts of user's content
        const [domainsCount, ideasCount] = await Promise.all([
          Domain.countDocuments({ createdBy: userId }),
          Idea.countDocuments({ createdBy: userId })
        ]);

        // Delete user's domains and ideas
        await Promise.all([
          Domain.deleteMany({ createdBy: userId }),
          Idea.deleteMany({ createdBy: userId })
        ]);

        // Delete the user
        await User.findByIdAndDelete(userId);

        console.log(`[ADMIN HARD DELETE] User ${user.username} permanently deleted by admin ${req.userId} (${domainsCount} domains, ${ideasCount} ideas)`);

        res.json({
          success: true,
          message: `User "${user.username}" and all associated content permanently deleted from database`,
          data: {
            deletedUser: user.username,
            deletedDomains: domainsCount,
            deletedIdeas: ideasCount
          }
        });
      } else {
        // Soft delete - deactivate account
        user.isActive = false;
        await user.save();

        console.log(`[ADMIN SOFT DELETE] User ${user.username} deactivated by admin ${req.userId}`);

        res.json({
          success: true,
          message: `User "${user.username}" has been deactivated`
        });
      }

    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during user deletion',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

router.post('/users/:userId/promote', requireAdmin, validateObjectId('userId'), promoteToAdmin);
router.post('/users/:userId/revoke', requireAdmin, validateObjectId('userId'), revokeAdmin);

// Enhanced: Admin dashboard data with error handling
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalDomains,
      totalIdeas,
      recentUsers,
      recentDomains,
      recentIdeas
    ] = await Promise.all([
      User.countDocuments(),
      Domain.countDocuments(),
      Idea.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt').lean(),
      Domain.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'username').lean(),
      Idea.find().sort({ createdAt: -1 }).limit(5).populate('domain', 'title').populate('createdBy', 'username').lean()
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDomains,
          totalIdeas
        },
        recent: {
          users: recentUsers,
          domains: recentDomains,
          ideas: recentIdeas
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced: Admin domain management with improved search and hard delete
router.delete('/domains/:domainId', 
  requireAdmin, 
  logAdminAction('DELETE_DOMAIN'),
  validateObjectId('domainId'), 
  async (req, res) => {
    try {
      const { domainId } = req.params;
      const { force = false, hardDelete = false } = req.query;

      const domain = await Domain.findById(domainId);
      
      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found'
        });
      }

      // Check if domain has active ideas
      const activeIdeasCount = await Idea.countDocuments({ 
        domain: domainId, 
        isActive: true 
      });

      if (activeIdeasCount > 0 && !force) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete domain. It contains ${activeIdeasCount} active ideas. Use force=true to delete anyway.`,
          data: {
            activeIdeasCount,
            forceDeleteUrl: `/admin/domains/${domainId}?force=true`
          }
        });
      }

      if (hardDelete === 'true') {
        // Hard delete - remove from database permanently
        if (activeIdeasCount > 0) {
          await Idea.deleteMany({ domain: domainId });
          console.log(`[ADMIN HARD DELETE] Permanently deleted ${activeIdeasCount} ideas in domain ${domain.title}`);
        }

        await Domain.findByIdAndDelete(domainId);
        
        console.log(`[ADMIN HARD DELETE] Domain "${domain.title}" permanently deleted from database by admin ${req.userId}`);

        res.json({
          success: true,
          message: `Domain "${domain.title}" and ${activeIdeasCount} associated ideas have been permanently deleted from database`,
          data: {
            deletedDomain: domain.title,
            deletedIdeas: activeIdeasCount
          }
        });
      } else {
        // Soft delete or force delete
        if (force && activeIdeasCount > 0) {
          await Idea.updateMany({ domain: domainId }, { isActive: false });
          console.log(`[ADMIN] Soft deleted ${activeIdeasCount} ideas in domain ${domain.title}`);
        }

        domain.isActive = false;
        await domain.save();
        
        console.log(`[ADMIN] Domain "${domain.title}" soft deleted by admin ${req.userId}`);

        res.json({
          success: true,
          message: `Domain "${domain.title}" and ${activeIdeasCount} associated ideas have been deactivated`,
          data: {
            deletedDomain: domain.title,
            deletedIdeas: activeIdeasCount
          }
        });
      }

    } catch (error) {
      console.error('Admin delete domain error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during domain deletion',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Enhanced: Admin idea management with improved search and hard delete
router.delete('/ideas/:ideaId', 
  requireAdmin, 
  logAdminAction('DELETE_IDEA'),
  validateObjectId('ideaId'), 
  async (req, res) => {
    try {
      const { ideaId } = req.params;
      const { hardDelete = false } = req.query;

      const idea = await Idea.findById(ideaId)
        .populate('domain', 'title')
        .populate('author', 'authorName');
      
      if (!idea) {
        return res.status(404).json({
          success: false,
          message: 'Idea not found'
        });
      }

      // Store info for response before deletion
      const ideaInfo = {
        title: idea.title,
        domain: idea.domain?.title,
        author: idea.author?.authorName
      };

      if (hardDelete === 'true') {
        // Hard delete - remove from database permanently
        // Update related stats before deletion
        if (idea.domain) {
          await Domain.findByIdAndUpdate(idea.domain._id, {
            $inc: { 'stats.totalIdeas': -1 }
          });
        }

        if (idea.author) {
          const Author = require('../models/Author');
          await Author.findByIdAndUpdate(idea.author._id, {
            $inc: { 'stats.totalIdeas': -1 },
            $pull: { ideas: ideaId }
          });
        }

        // Delete the idea permanently
        await Idea.findByIdAndDelete(ideaId);
        
        console.log(`[ADMIN HARD DELETE] Idea "${idea.title}" permanently deleted from database by admin ${req.userId}`);

        res.json({
          success: true,
          message: `Idea "${ideaInfo.title}" has been permanently deleted from database`,
          data: {
            deletedIdea: ideaInfo
          }
        });
      } else {
        // Soft delete
        idea.isActive = false;
        await idea.save();
        
        console.log(`[ADMIN SOFT DELETE] Idea "${idea.title}" deactivated by admin ${req.userId}`);

        res.json({
          success: true,
          message: `Idea "${ideaInfo.title}" has been deactivated`,
          data: {
            deletedIdea: ideaInfo
          }
        });
      }

    } catch (error) {
      console.error('Admin delete idea error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during idea deletion',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Enhanced: Admin user management
router.get('/users/:userId', requireAdmin, validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('following', 'username fullName')
      .populate('followers', 'username fullName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's domains and ideas count
    const [domainsCount, ideasCount] = await Promise.all([
      Domain.countDocuments({ createdBy: userId }),
      Idea.countDocuments({ createdBy: userId })
    ]);

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          stats: {
            domainsCreated: domainsCount,
            ideasCreated: ideasCount,
            followersCount: user.followers?.length || 0,
            followingCount: user.following?.length || 0
          }
        }
      }
    });

  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced: Deactivate/Activate user
router.patch('/users/:userId/toggle-active', 
  requireAdmin, 
  logAdminAction('TOGGLE_USER_STATUS'),
  validateObjectId('userId'), 
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.userId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      const action = user.isActive ? 'activated' : 'deactivated';
      console.log(`[ADMIN] User ${user.username} ${action} by admin ${req.userId}`);

      res.json({
        success: true,
        message: `User ${user.username} has been ${action}`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            isActive: user.isActive
          }
        }
      });

    } catch (error) {
      console.error('Admin toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Enhanced: Get all domains for admin management with improved search
router.get('/domains', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    console.log('Admin domains request:', { page, limit, search });

    let filter = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ]
      };
    }

    console.log('Domain search filter:', JSON.stringify(filter));

    const domains = await Domain.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Use lean for better performance

    const total = await Domain.countDocuments(filter);

    console.log(`Found ${domains.length} domains out of ${total} total`);

    // Add idea counts for each domain
    const domainsWithStats = await Promise.all(
      domains.map(async (domain) => {
        const ideaCount = await Idea.countDocuments({ domain: domain._id });
        return {
          ...domain,
          ideaCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        domains: domainsWithStats,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: domains.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Admin get domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced: Get all ideas for admin management with improved search
router.get('/ideas', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, domain } = req.query;
    
    console.log('Admin ideas request:', { page, limit, search, domain });

    let filter = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }
    if (domain) {
      filter.domain = domain;
    }

    console.log('Idea search filter:', JSON.stringify(filter));

    const ideas = await Idea.find(filter)
      .populate('domain', 'title')
      .populate('author', 'authorName')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Use lean for better performance

    const total = await Idea.countDocuments(filter);

    console.log(`Found ${ideas.length} ideas out of ${total} total`);

    res.json({
      success: true,
      data: {
        ideas,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: ideas.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Admin get ideas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;