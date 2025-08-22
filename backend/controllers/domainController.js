// controllers/domainController.js - Enhanced with improved search functionality and data fetching
const { validationResult } = require('express-validator');
const Domain = require('../models/Domain');
const Idea = require('../models/Idea');

// Helper function to parse and validate topics with comprehensive error handling
const parseAndValidateTopics = (topicsData) => {
  console.log('Parsing topics:', typeof topicsData, topicsData);
  
  try {
    let topics;
    
    // Handle different input formats
    if (typeof topicsData === 'string') {
      topics = JSON.parse(topicsData);
    } else if (typeof topicsData === 'object' && topicsData !== null) {
      topics = topicsData;
    } else {
      throw new Error('Topics must be provided as string or object');
    }
    
    // Validate structure
    if (!topics || typeof topics !== 'object') {
      throw new Error('Topics must be an object');
    }
    
    // Ensure all required properties exist and are arrays
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      if (!topics.hasOwnProperty(level)) {
        topics[level] = [];
      }
      if (!Array.isArray(topics[level])) {
        // Try to convert to array if it's a string
        if (typeof topics[level] === 'string') {
          topics[level] = topics[level] ? [topics[level]] : [];
        } else {
          topics[level] = [];
        }
      }
      
      // Clean up topics - remove empty strings and trim whitespace
      topics[level] = topics[level]
        .map(topic => typeof topic === 'string' ? topic.trim() : String(topic).trim())
        .filter(topic => topic.length > 0);
    }
    
    // Check if at least one topic exists
    const totalTopics = topics.easy.length + topics.medium.length + topics.hard.length;
    if (totalTopics === 0) {
      throw new Error('At least one topic must be provided in any difficulty level');
    }
    
    console.log('Topics validation passed:', { 
      totalTopics, 
      easy: topics.easy.length,
      medium: topics.medium.length,
      hard: topics.hard.length 
    });
    
    return topics;
    
  } catch (error) {
    console.error('Topics parsing error:', error.message);
    throw new Error(`Invalid topics format: ${error.message}`);
  }
};

// Enhanced: Get all domains with improved error handling and data fetching
exports.getAllDomains = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      featured,
      isActive = true, 
      page = 1, 
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    console.log('Get all domains request:', { category, search, featured, isActive, page, limit, sort, order });

    // Build filter object
    const filter = { 
      isActive: isActive === 'false' ? false : true  // Handle string 'false'
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (featured !== undefined) {
      filter['featured.isFeatured'] = featured === 'true';
    }

    // Add search if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    console.log('Domain filter:', JSON.stringify(filter));

    // Apply population and sorting
    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    
    const domains = await Domain.find(filter)
      .populate('createdBy', 'username fullName profileImage')
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Use lean for better performance
    
    // Get total count for pagination
    const total = await Domain.countDocuments(filter);

    console.log(`Found ${domains.length} domains out of ${total} total`);

    // Populate with idea counts and ensure imageUrl compatibility
    const domainsWithStats = await Promise.all(
      domains.map(async (domain) => {
        const ideaCount = await Idea.countDocuments({ 
          domain: domain._id, 
          isActive: true 
        });
        
        return {
          ...domain,
          ideaCount,
          totalTopics: (domain.topics?.easy?.length || 0) + 
                       (domain.topics?.medium?.length || 0) + 
                       (domain.topics?.hard?.length || 0),
          // Ensure both field names for compatibility
          imageurl: domain.imageUrl,
          imageUrl: domain.imageUrl
        };
      })
    );

    // Return domains array directly for frontend compatibility
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

// Enhanced: Get domain by ID with improved data fetching
exports.getDomainById = async (req, res) => {
  try {
    const { domainId } = req.params;
    console.log('Fetching domain with ID:', domainId);
    
    const domain = await Domain.findById(domainId)
      .populate('createdBy', 'username fullName profileImage bio')
      .populate('moderators', 'username fullName profileImage')
      .lean(); // Use lean for better performance

    if (!domain || !domain.isActive) {
      console.log('Domain not found or inactive for ID:', domainId);
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    console.log('Domain found:', domain.title);
    
    // Get associated ideas for this domain
    const ideas = await Idea.find({ 
      domain: domainId, 
      isActive: true,
      isPublic: true,
      moderationStatus: { $in: ['approved', 'pending'] }
    })
    .populate('author', 'authorName profileImage authorEmail')
    .populate('createdBy', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .lean(); // Use lean for better performance

    console.log('Ideas found for domain:', ideas.length);
    
    // Calculate total topics
    const totalTopics = (domain.topics?.easy?.length || 0) + 
                       (domain.topics?.medium?.length || 0) + 
                       (domain.topics?.hard?.length || 0);

    // Build response with all necessary fields
    const responseData = {
      _id: domain._id,
      title: domain.title,
      description: domain.description,
      detailedDescription: domain.detailedDescription,
      // Ensure both field names for compatibility
      imageurl: domain.imageUrl,
      imageUrl: domain.imageUrl,
      category: domain.category,
      tags: domain.tags || [],
      topics: domain.topics || { easy: [], medium: [], hard: [] },
      stats: domain.stats || { totalViews: 0, totalLikes: 0, totalShares: 0 },
      settings: domain.settings || { allowComments: true, requireModeration: false, isPublic: true },
      featured: domain.featured || { isFeatured: false },
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      createdBy: domain.createdBy,
      moderators: domain.moderators || [],
      // Add ideas array for frontend
      ideas: ideas,
      totalTopics,
      ideaCount: ideas.length,
      // Add admin permissions for frontend
      canEdit: req.userId && (req.userId === domain.createdBy._id.toString() || req.user?.isAdmin),
      canDelete: req.userId && (req.userId === domain.createdBy._id.toString() || req.user?.isAdmin),
      isAdmin: req.user?.isAdmin || false
    };

    console.log('Sending response with structure:', {
      hasIdeas: !!responseData.ideas,
      ideasCount: responseData.ideas?.length,
      hasImageurl: !!responseData.imageurl,
      hasImageUrl: !!responseData.imageUrl,
      hasTags: !!responseData.tags,
      hasTopics: !!responseData.topics,
      totalTopics: responseData.totalTopics,
      canEdit: responseData.canEdit,
      canDelete: responseData.canDelete,
      isAdmin: responseData.isAdmin
    });

    // Update view count if user is authenticated and different from creator
    if (req.userId && req.userId !== domain.createdBy._id.toString()) {
      try {
        await Domain.findByIdAndUpdate(domainId, {
          $inc: { 'stats.totalViews': 1 }
        });
        responseData.stats.totalViews += 1;
      } catch (viewError) {
        console.log('Failed to update view count:', viewError.message);
        // Don't fail the request for view count update failure
      }
    }

    // Return domain data directly for frontend compatibility
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

// Enhanced: Create new domain with comprehensive validation
exports.createDomain = async (req, res) => {
  try {
    console.log('Creating domain - Request body:', {
      title: req.body.title,
      description: req.body.description?.substring(0, 50) + '...',
      category: req.body.category,
      topics: typeof req.body.topics,
      tags: req.body.tags,
      hasFile: !!req.file
    });

    // Extract and validate basic fields
    const { title, description, detailedDescription, category, tags } = req.body;
    
    // Basic validation (in addition to middleware)
    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Domain title must be between 3 and 100 characters'
      });
    }

    if (!description || description.trim().length < 10 || description.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description must be between 10 and 1000 characters'
      });
    }

    // Parse and validate topics with comprehensive error handling
    let parsedTopics;
    try {
      parsedTopics = parseAndValidateTopics(req.body.topics);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Check if domain with same title exists (case-insensitive)
    const existingDomain = await Domain.findOne({ 
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
      isActive: true 
    });
    
    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: 'A domain with this title already exists'
      });
    }

    // Handle image upload
    let imageUrl = '/uploads/defaults/default-domain.jpg';
    if (req.file) {
      imageUrl = `/uploads/domains/${req.file.filename}`;
      console.log('Image uploaded:', imageUrl);
    }

    // Process tags
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag.trim().length > 0);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    }

    console.log('Creating domain with processed data:', {
      title: title.trim(),
      category: category || 'Other',
      topicsCount: {
        easy: parsedTopics.easy.length,
        medium: parsedTopics.medium.length,
        hard: parsedTopics.hard.length
      },
      tagsCount: processedTags.length,
      imageUrl
    });

    // Create domain
    const domain = new Domain({
      title: title.trim(),
      slug: title.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''), // Remove leading/trailing hyphens
      description: description.trim(),
      detailedDescription: detailedDescription ? detailedDescription.trim() : undefined,
      category: category || 'Other',
      tags: processedTags,
      topics: parsedTopics,
      imageUrl,
      createdBy: req.userId,
      moderationStatus: 'approved', // Auto-approve for now
      isActive: true,
      stats: {
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0
      },
      settings: {
        allowComments: true,
        requireModeration: false,
        isPublic: true
      }
    });

    const savedDomain = await domain.save();
    console.log('Domain created successfully:', savedDomain._id);

    // Populate the created domain for response
    await savedDomain.populate('createdBy', 'username fullName profileImage');

    // Calculate totalTopics
    const totalTopics = parsedTopics.easy.length + parsedTopics.medium.length + parsedTopics.hard.length;

    res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      data: { 
        domain: {
          ...savedDomain.toObject(),
          // Ensure both field names for compatibility
          imageurl: savedDomain.imageUrl,
          totalTopics
        }
      }
    });

  } catch (error) {
    console.error('Create domain error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Domain with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error occurred while creating domain',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enhanced: Update domain with comprehensive validation
exports.updateDomain = async (req, res) => {
  try {
    const { domainId } = req.params;
    const updates = req.body;

    console.log('Updating domain:', domainId, 'with updates:', Object.keys(updates));

    const domain = await Domain.findById(domainId);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Check permissions - allow admin or owner
    if (domain.createdBy.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this domain'
      });
    }

    // Handle image upload
    if (req.file) {
      updates.imageUrl = `/uploads/domains/${req.file.filename}`;
      console.log('New image uploaded:', updates.imageUrl);
    }

    // Parse topics if provided
    if (updates.topics) {
      try {
        updates.topics = parseAndValidateTopics(updates.topics);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    // Process tags if provided
    if (updates.tags) {
      if (Array.isArray(updates.tags)) {
        updates.tags = updates.tags.filter(tag => tag.trim().length > 0);
      } else if (typeof updates.tags === 'string') {
        updates.tags = updates.tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    }

    // Update slug if title changed
    if (updates.title && updates.title !== domain.title) {
      updates.slug = updates.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const updatedDomain = await Domain.findByIdAndUpdate(
      domainId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName profileImage');

    console.log('Domain updated successfully:', updatedDomain._id);

    // Calculate totalTopics
    const totalTopics = (updatedDomain.topics?.easy?.length || 0) + 
                       (updatedDomain.topics?.medium?.length || 0) + 
                       (updatedDomain.topics?.hard?.length || 0);

    res.json({
      success: true,
      message: 'Domain updated successfully',
      data: { 
        domain: {
          ...updatedDomain.toObject(),
          imageurl: updatedDomain.imageUrl,
          totalTopics
        }
      }
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

// Enhanced: Delete domain with improved logic (supports both admin and regular users)
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

    // Check permissions - allow admin or owner
    if (domain.createdBy.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this domain'
      });
    }

    // Check if domain has active ideas
    const activeIdeasCount = await Idea.countDocuments({ 
      domain: domainId, 
      isActive: true 
    });
    
    // Admin can force delete, regular users get soft delete with ideas
    if (activeIdeasCount > 0) {
      // Soft delete - just mark as inactive
      domain.isActive = false;
      await domain.save();
      
      const userType = req.user?.isAdmin ? 'admin' : 'user';
      console.log(`Domain ${domainId} soft deleted by ${userType} ${req.userId} (has ${activeIdeasCount} active ideas)`);
      
      return res.json({
        success: true,
        message: `Domain archived successfully. It contained ${activeIdeasCount} active ideas.`
      });
    }

    // Hard delete if no active ideas
    await Domain.findByIdAndDelete(domainId);
    
    const userType = req.user?.isAdmin ? 'admin' : 'user';
    console.log(`Domain ${domainId} hard deleted by ${userType} ${req.userId} (no active ideas)`);

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

// Enhanced: Get domain topics with better filtering
exports.getDomainTopics = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { level, format = 'grouped' } = req.query;

    const domain = await Domain.findById(domainId).select('title topics').lean();
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const domainTopics = domain.topics || { easy: [], medium: [], hard: [] };
    let topics = [];
    
    if (level && ['easy', 'medium', 'hard'].includes(level)) {
      // Return topics for specific level
      topics = domainTopics[level] || [];
      
      if (format === 'flat') {
        topics = topics.map(topic => ({ topic, level }));
      }
    } else {
      // Return all topics
      if (format === 'flat') {
        topics = [
          ...(domainTopics.easy || []).map(topic => ({ topic, level: 'easy' })),
          ...(domainTopics.medium || []).map(topic => ({ topic, level: 'medium' })),
          ...(domainTopics.hard || []).map(topic => ({ topic, level: 'hard' }))
        ];
      } else {
        topics = domainTopics;
      }
    }

    const totalTopics = (domainTopics.easy?.length || 0) + 
                       (domainTopics.medium?.length || 0) + 
                       (domainTopics.hard?.length || 0);

    res.json({
      success: true,
      data: {
        domain: {
          id: domain._id,
          title: domain.title
        },
        topics,
        level: level || 'all',
        format,
        totalTopics
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

// Enhanced: Get domain statistics with comprehensive data
exports.getDomainStats = async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findById(domainId).lean();
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Get detailed statistics
    const [
      totalIdeas, 
      activeIdeas, 
      ideaStats, 
      recentIdeas
    ] = await Promise.all([
      Idea.countDocuments({ domain: domainId }),
      Idea.countDocuments({ domain: domainId, isActive: true }),
      Idea.aggregate([
        { $match: { domain: domain._id } },
        { 
          $group: { 
            _id: null, 
            totalLikes: { $sum: '$stats.totalLikes' },
            totalViews: { $sum: '$stats.totalViews' },
            totalComments: { $sum: '$stats.totalComments' }
          } 
        }
      ]),
      Idea.find({ domain: domainId, isActive: true })
        .populate('author', 'authorName')
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt difficulty category')
        .lean()
    ]);

    const domainTopics = domain.topics || { easy: [], medium: [], hard: [] };
    const totalTopics = (domainTopics.easy?.length || 0) + 
                       (domainTopics.medium?.length || 0) + 
                       (domainTopics.hard?.length || 0);

    const stats = {
      domain: {
        id: domain._id,
        title: domain.title,
        category: domain.category,
        createdAt: domain.createdAt
      },
      ideas: {
        total: totalIdeas,
        active: activeIdeas,
        inactive: totalIdeas - activeIdeas,
        recent: recentIdeas
      },
      engagement: {
        totalLikes: ideaStats[0]?.totalLikes || 0,
        totalViews: ideaStats[0]?.totalViews || 0,
        totalComments: ideaStats[0]?.totalComments || 0,
        domainViews: domain.stats?.totalViews || 0
      },
      topics: {
        easy: domainTopics.easy?.length || 0,
        medium: domainTopics.medium?.length || 0,
        hard: domainTopics.hard?.length || 0,
        total: totalTopics
      },
      metadata: {
        tags: domain.tags?.length || 0,
        isPublic: domain.settings?.isPublic !== false,
        allowComments: domain.settings?.allowComments !== false
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

// Enhanced: Search domains with improved functionality
exports.searchDomains = async (req, res) => {
  try {
    const { 
      q: query, 
      category, 
      tags,
      difficulty,
      page = 1, 
      limit = 20,
      sort = 'relevance' 
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchQuery = query.trim();
    console.log('Searching domains with query:', searchQuery);

    // Build search filters
    const filters = { isActive: true };
    
    if (category && category !== 'all') {
      filters.category = category;
    }
    
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      filters.tags = { $in: tagList };
    }

    // Create text search or regex search based on MongoDB text index availability
    let searchFilter;
    let domains;
    
    try {
      // Try text search first
      searchFilter = {
        ...filters,
        $text: { $search: searchQuery }
      };
      
      domains = await Domain.find(searchFilter, { score: { $meta: "textScore" } })
        .populate('createdBy', 'username fullName profileImage')
        .sort(sort === 'relevance' ? { score: { $meta: "textScore" } } : { [sort]: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      console.log(`Text search found ${domains.length} domains`);

    } catch (textSearchError) {
      console.log('Text search failed, falling back to regex search:', textSearchError.message);
      
      // Fallback to regex search
      const searchRegex = new RegExp(searchQuery, 'i');
      searchFilter = {
        ...filters,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      };

      domains = await Domain.find(searchFilter)
        .populate('createdBy', 'username fullName profileImage')
        .sort({ [sort === 'relevance' ? 'createdAt' : sort]: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      console.log(`Regex search found ${domains.length} domains`);
    }

    // Add idea counts and ensure compatibility
    const domainsWithStats = await Promise.all(
      domains.map(async (domain) => {
        const ideaCount = await Idea.countDocuments({ 
          domain: domain._id, 
          isActive: true 
        });
        
        const totalTopics = (domain.topics?.easy?.length || 0) + 
                           (domain.topics?.medium?.length || 0) + 
                           (domain.topics?.hard?.length || 0);
        
        return {
          ...domain,
          ideaCount,
          totalTopics,
          imageurl: domain.imageUrl,
          score: domain.score // Include search relevance score if available
        };
      })
    );

    res.json({
      success: true,
      data: {
        domains: domainsWithStats,
        query: searchQuery,
        filters: { category, tags, difficulty },
        pagination: {
          current: parseInt(page),
          count: domainsWithStats.length,
          hasMore: domainsWithStats.length === parseInt(limit)
        },
        searchMethod: domains.length > 0 && domains[0].score ? 'text' : 'regex'
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