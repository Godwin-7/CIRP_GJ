// routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  requireAdmin, 
  logAdminAction, 
  getAdminUsers, 
  promoteToAdmin, 
  revokeAdmin 
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
router.post('/users/:userId/promote', requireAdmin, validateObjectId('userId'), promoteToAdmin);
router.post('/users/:userId/revoke', requireAdmin, validateObjectId('userId'), revokeAdmin);

// Admin dashboard data
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
      User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt'),
      Domain.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'username'),
      Idea.find().sort({ createdAt: -1 }).limit(5).populate('domain', 'title').populate('createdBy', 'username')
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

// Admin domain management
router.delete('/domains/:domainId', 
  requireAdmin, 
  logAdminAction('DELETE_DOMAIN'),
  validateObjectId('domainId'), 
  async (req, res) => {
    try {
      const { domainId } = req.params;
      const { force = false } = req.query; // Query parameter for force delete

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

      // Force delete or no active ideas - proceed with deletion
      if (force && activeIdeasCount > 0) {
        // Delete all ideas in this domain first
        await Idea.deleteMany({ domain: domainId });
        console.log(`[ADMIN] Force deleted ${activeIdeasCount} ideas in domain ${domain.title}`);
      }

      // Delete the domain
      await Domain.findByIdAndDelete(domainId);
      
      console.log(`[ADMIN] Domain "${domain.title}" deleted by admin ${req.userId}`);

      res.json({
        success: true,
        message: `Domain "${domain.title}" and ${activeIdeasCount} associated ideas have been permanently deleted`,
        data: {
          deletedDomain: domain.title,
          deletedIdeas: activeIdeasCount
        }
      });

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

// Admin idea management
router.delete('/ideas/:ideaId', 
  requireAdmin, 
  logAdminAction('DELETE_IDEA'),
  validateObjectId('ideaId'), 
  async (req, res) => {
    try {
      const { ideaId } = req.params;

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

      // Update related stats before deletion
      if (idea.domain) {
        await Domain.findByIdAndUpdate(idea.domain, {
          $inc: { 'stats.totalIdeas': -1 }
        });
      }

      if (idea.author) {
        const Author = require('../models/Author');
        await Author.findByIdAndUpdate(idea.author, {
          $inc: { 'stats.totalIdeas': -1 },
          $pull: { ideas: ideaId }
        });
      }

      // Delete the idea permanently
      await Idea.findByIdAndDelete(ideaId);
      
      console.log(`[ADMIN] Idea "${idea.title}" permanently deleted by admin ${req.userId}`);

      res.json({
        success: true,
        message: `Idea "${ideaInfo.title}" has been permanently deleted`,
        data: {
          deletedIdea: ideaInfo
        }
      });

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

// Admin user management
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
            followersCount: user.followers.length,
            followingCount: user.following.length
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

// Deactivate/Activate user
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

// Get all domains for admin management
router.get('/domains', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let filter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter = {
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      };
    }

    const domains = await Domain.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Domain.countDocuments(filter);

    // Add idea counts for each domain
    const domainsWithStats = await Promise.all(
      domains.map(async (domain) => {
        const ideaCount = await Idea.countDocuments({ domain: domain._id });
        return {
          ...domain.toObject(),
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

// Get all ideas for admin management
router.get('/ideas', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, domain } = req.query;
    
    let filter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }
    if (domain) {
      filter.domain = domain;
    }

    const ideas = await Idea.find(filter)
      .populate('domain', 'title')
      .populate('author', 'authorName')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Idea.countDocuments(filter);

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