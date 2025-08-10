const { validationResult } = require('express-validator');
const Domain = require('../models/Domain');
const Idea = require('../models/Idea');

// Get all domains
exports.getAllDomains = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      isActive = true, 
      page = 1, 
      limit = 20,
      sort = 'createdAt'
    } = req.query;

    // Build filter object
    const filter = { isActive };
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Build query
    let query = Domain.find(filter);

    // Add search if provided
    if (search) {
      query = Domain.searchDomains(search, filter, { 
        limit: parseInt(limit),
        sort: { [sort]: -1 }
      });
    } else {
      query = query
        .populate('createdBy', 'username fullName profileImage')
        .sort({ [sort]: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    }

    const domains = await query;
    
    // Get total count for pagination
    const total = await Domain.countDocuments(filter);

    // Populate with idea counts
    const domainsWithStats = await Promise.all(
      domains.map(async (domain) => {
        const ideaCount = await Idea.countDocuments({ 
          domain: domain._id, 
          isActive: true 
        });
        
        return {
          ...domain.toObject(),
          ideaCount,
          totalTopics: domain.totalTopics,
          // Fix the imageUrl property name to match frontend expectations
          imageurl: domain.imageUrl
        };
      })
    );

    // IMPORTANT: Return the domains array directly for compatibility with your frontend
    // Your frontend expects response.data to be the domains array
    res.json(domainsWithStats);

  } catch (error) {
    console.error('Get all domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get domain by ID - FIXED VERSION
exports.getDomainById = async (req, res) => {
  try {
    const { domainId } = req.params;
    console.log('Fetching domain with ID:', domainId);
    
    const domain = await Domain.findById(domainId)
      .populate('createdBy', 'username fullName profileImage bio')
      .populate('moderators', 'username fullName profileImage');

    if (!domain) {
      console.log('Domain not found for ID:', domainId);
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    console.log('Domain found:', domain.title);
    
    // ✅ CRITICAL FIX: Get associated ideas for this domain
    const ideas = await Idea.find({ 
      domain: domainId, 
      isActive: true,
      isPublic: true,
      moderationStatus: { $in: ['approved', 'pending'] }  // Include pending for now
    })
    .populate('author', 'authorName profileImage authorEmail')
    .populate('createdBy', 'username fullName profileImage')
    .sort({ createdAt: -1 });

    console.log('Ideas found for domain:', ideas.length);
    
    // Update view count
    domain.stats.totalViews += 1;
    await domain.save();

    // ✅ CRITICAL FIX: Return domain with ideas and correct image field
    const responseData = {
      _id: domain._id,
      title: domain.title,
      description: domain.description,
      detailedDescription: domain.detailedDescription,
      // ✅ CRITICAL: Fix image field name for frontend compatibility
      imageurl: domain.imageUrl, // Frontend expects 'imageurl'
      imageUrl: domain.imageUrl,  // Keep both for compatibility
      category: domain.category,
      tags: domain.tags,
      topics: domain.topics,
      stats: domain.stats,
      settings: domain.settings,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      createdBy: domain.createdBy,
      moderators: domain.moderators,
      // ✅ CRITICAL: Add ideas array that frontend expects
      ideas: ideas,
      totalTopics: domain.totalTopics,
      ideaCount: ideas.length
    };

    console.log('Sending response with structure:', {
      hasIdeas: !!responseData.ideas,
      ideasCount: responseData.ideas?.length,
      hasImageurl: !!responseData.imageurl,
      hasImageUrl: !!responseData.imageUrl
    });

    // Return domain data directly (not wrapped) - this is what frontend expects
    res.json(responseData);

  } catch (error) {
    console.error('Get domain by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new domain
exports.createDomain = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, detailedDescription, topics, category, tags } = req.body;

    // Check if domain with same title exists
    const existingDomain = await Domain.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });

    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: 'Domain with this title already exists'
      });
    }

    // Handle image upload
    let imageUrl = '/uploads/defaults/default-domain.jpg';
    if (req.file) {
      imageUrl = `/uploads/domains/${req.file.filename}`;
    }

    // Parse topics if it's a string
    let parsedTopics;
    try {
      parsedTopics = typeof topics === 'string' ? JSON.parse(topics) : topics;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid topics format'
      });
    }

    // Validate topics structure
    if (!parsedTopics || 
        !Array.isArray(parsedTopics.easy) || 
        !Array.isArray(parsedTopics.medium) || 
        !Array.isArray(parsedTopics.hard)) {
      return res.status(400).json({
        success: false,
        message: 'Topics must contain easy, medium, and hard arrays'
      });
    }

    // Create domain
    const domain = new Domain({
      title,
      imageUrl,
      description,
      detailedDescription,
      topics: parsedTopics,
      category: category || 'Other',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      createdBy: req.userId
    });

    await domain.save();

    // Populate created domain
    await domain.populate('createdBy', 'username fullName profileImage');

    res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      data: { domain }
    });

  } catch (error) {
    console.error('Create domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update domain
exports.updateDomain = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { domainId } = req.params;
    const updates = req.body;

    const domain = await Domain.findById(domainId);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Check permissions (only creator or admin can update)
    if (domain.createdBy.toString() !== req.userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this domain'
      });
    }

    // Handle image update
    if (req.file) {
      updates.imageUrl = `/uploads/domains/${req.file.filename}`;
    }

    // Parse topics if provided
    if (updates.topics && typeof updates.topics === 'string') {
      try {
        updates.topics = JSON.parse(updates.topics);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid topics format'
        });
      }
    }

    // Handle tags
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    const updatedDomain = await Domain.findByIdAndUpdate(
      domainId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName profileImage');

    res.json({
      success: true,
      message: 'Domain updated successfully',
      data: { domain: updatedDomain }
    });

  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete domain
exports.deleteDomain = async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findById(domainId);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Check permissions (only creator or admin can delete)
    if (domain.createdBy.toString() !== req.userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this domain'
      });
    }

    // Check if domain has ideas
    const ideaCount = await Idea.countDocuments({ domain: domainId });
    
    if (ideaCount > 0) {
      // Soft delete - just mark as inactive
      domain.isActive = false;
      await domain.save();
      
      return res.json({
        success: true,
        message: 'Domain archived successfully (contains ideas)'
      });
    }

    // Hard delete if no ideas
    await Domain.findByIdAndDelete(domainId);

    res.json({
      success: true,
      message: 'Domain deleted successfully'
    });

  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get domain topics by level
exports.getDomainTopics = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { level } = req.query;

    const domain = await Domain.findById(domainId);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    let topics = [];
    
    if (level && ['easy', 'medium', 'hard'].includes(level)) {
      topics = domain.topics[level] || [];
    } else {
      // Return all topics with their levels
      topics = [
        ...domain.topics.easy.map(topic => ({ topic, level: 'easy' })),
        ...domain.topics.medium.map(topic => ({ topic, level: 'medium' })),
        ...domain.topics.hard.map(topic => ({ topic, level: 'hard' }))
      ];
    }

    res.json({
      success: true,
      data: {
        domain: {
          id: domain._id,
          title: domain.title,
          description: domain.description
        },
        topics,
        level: level || 'all'
      }
    });

  } catch (error) {
    console.error('Get domain topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search domains
exports.searchDomains = async (req, res) => {
  try {
    const { q: query, category, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = { isActive: true };
    if (category && category !== 'all') {
      filters.category = category;
    }

    const domains = await Domain.searchDomains(query, filters, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        domains,
        query,
        pagination: {
          current: parseInt(page),
          count: domains.length
        }
      }
    });

  } catch (error) {
    console.error('Search domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get domain statistics
exports.getDomainStats = async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findById(domainId);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Get detailed statistics
    const [totalIdeas, activeIdeas, totalLikes, totalViews] = await Promise.all([
      Idea.countDocuments({ domain: domainId }),
      Idea.countDocuments({ domain: domainId, isActive: true }),
      Idea.aggregate([
        { $match: { domain: domain._id } },
        { $group: { _id: null, totalLikes: { $sum: '$stats.totalLikes' } } }
      ]),
      Idea.aggregate([
        { $match: { domain: domain._id } },
        { $group: { _id: null, totalViews: { $sum: '$stats.totalViews' } } }
      ])
    ]);

    const stats = {
      domain: {
        id: domain._id,
        title: domain.title,
        category: domain.category
      },
      ideas: {
        total: totalIdeas,
        active: activeIdeas,
        inactive: totalIdeas - activeIdeas
      },
      engagement: {
        totalLikes: totalLikes[0]?.totalLikes || 0,
        totalViews: totalViews[0]?.totalViews || 0,
        domainViews: domain.stats.totalViews
      },
      topics: {
        easy: domain.topics.easy.length,
        medium: domain.topics.medium.length,
        hard: domain.topics.hard.length,
        total: domain.totalTopics
      }
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get domain stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};