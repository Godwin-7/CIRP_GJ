const { validationResult } = require('express-validator');
const Idea = require('../models/Idea');
const Domain = require('../models/Domain');
const Author = require('../models/Author');
const Comment = require('../models/Comment');

// Get all ideas
exports.getAllIdeas = async (req, res) => {
  try {
    const { 
      domain, 
      difficulty, 
      status, 
      category,
      search, 
      page = 1, 
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = { 
      isActive: true, 
      isPublic: true, 
      moderationStatus: 'approved' 
    };
    
    if (domain) filter.domain = domain;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Build query
    let query;
    
    if (search) {
      query = Idea.searchIdeas(search, filter, {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 }
      });
    } else {
      query = Idea.find(filter)
        .populate('domain', 'title slug imageUrl')
        .populate('author', 'authorName profileImage phone socialMedia')
        .populate('createdBy', 'username fullName profileImage')
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    }

    const ideas = await query;
    
    // Get total count for pagination
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
    console.error('Get all ideas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get idea by ID
exports.getIdeaById = async (req, res) => {
  try {
    const { ideaId } = req.params;

    const idea = await Idea.findById(ideaId)
      .populate('domain', 'title slug imageUrl description')
      .populate('author', 'authorName authorEmail contactInfo profileImage bio organization phone socialMedia')
      .populate('createdBy', 'username fullName profileImage bio')
      .populate('likes.user', 'username fullName profileImage')
      .populate('collaborationInterests.user', 'username fullName profileImage');

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Check if idea is accessible
    if (!idea.isPublic && (!req.userId || (idea.createdBy._id.toString() !== req.userId && !req.user?.isAdmin))) {
      return res.status(403).json({
        success: false,
        message: 'This idea is private'
      });
    }

    // Add view if user is authenticated
    if (req.userId && req.userId !== idea.createdBy._id.toString()) {
      idea.addView(req.userId, 0, req.headers.referer || 'direct');
      await idea.save();
    }

    // Get comments for this idea
    const comments = await Comment.getCommentsForTarget('idea', ideaId, {
      includeReplies: false,
      limit: 20
    });

    res.json({
      success: true,
      data: {
        idea,
        comments,
        userInteraction: req.userId ? {
          isLiked: idea.isLikedBy(req.userId),
          hasCollaborationInterest: idea.collaborationInterests.some(
            ci => ci.user._id.toString() === req.userId
          )
        } : null
      }
    });

  } catch (error) {
    console.error('Get idea by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new idea
exports.createIdea = async (req, res) => {
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

    const { 
      title, 
      description, 
      detailedDescription,
      domainId, 
      authorId,
      difficulty,
      category,
      status,
      tags,
      relatedLinks,
      requiredSkills,
      estimatedDuration,
      scope,
      currentResearch,
      futureEnhancements
    } = req.body;

    // Verify domain exists
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Verify author exists
    const author = await Author.findById(authorId);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Handle file uploads
    const files = req.files || {};
    
    let projectImage = '/uploads/defaults/default-project.png';
    if (files.projectImage && files.projectImage[0]) {
      projectImage = `/uploads/ideas/${files.projectImage[0].filename}`;
    }

    let additionalImages = [];
    if (files.additionalImages) {
      additionalImages = files.additionalImages.map((file, index) => ({
        url: `/uploads/ideas/${file.filename}`,
        caption: req.body[`imageCaption${index}`] || '',
        uploadedAt: new Date()
      }));
    }

    let projectPdf = null;
    if (files.projectPdf && files.projectPdf[0]) {
      const pdfFile = files.projectPdf[0];
      projectPdf = {
        filename: pdfFile.filename,
        originalName: pdfFile.originalname,
        path: `/uploads/pdfs/${pdfFile.filename}`,
        size: pdfFile.size,
        uploadedAt: new Date()
      };
    }

    // Parse JSON fields
    const parseJsonField = (field) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return [];
        }
      }
      return field || [];
    };

    // Create idea
    const idea = new Idea({
      title,
      description,
      detailedDescription,
      domain: domainId,
      author: authorId,
      createdBy: req.userId,
      difficulty,
      category: category || 'Research',
      status: status || 'Not yet started',
      projectImage,
      additionalImages,
      projectPdf,
      tags: parseJsonField(tags),
      relatedLinks: parseJsonField(relatedLinks),
      requiredSkills: parseJsonField(requiredSkills),
      estimatedDuration: estimatedDuration ? JSON.parse(estimatedDuration) : null,
      scope: parseJsonField(scope),
      currentResearch: currentResearch ? JSON.parse(currentResearch) : null,
      futureEnhancements: parseJsonField(futureEnhancements)
    });

    await idea.save();

    // Update domain stats
    domain.stats.totalIdeas += 1;
    await domain.save();

    // Update author stats
    author.stats.totalIdeas += 1;
    author.ideas.push(idea._id);
    await author.save();

    // Populate the created idea
    await idea.populate([
      { path: 'domain', select: 'title slug imageUrl' },
      { path: 'author', select: 'authorName profileImage phone socialMedia' },
      { path: 'createdBy', select: 'username fullName profileImage' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Idea created successfully',
      data: { idea }
    });

  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update idea
exports.updateIdea = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { ideaId } = req.params;
    const updates = req.body;

    const idea = await Idea.findById(ideaId);
    
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Check permissions
    if (idea.createdBy.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this idea'
      });
    }

    // Handle file uploads
    const files = req.files || {};
    
    if (files.projectImage && files.projectImage[0]) {
      updates.projectImage = `/uploads/ideas/${files.projectImage[0].filename}`;
    }

    if (files.additionalImages) {
      const additionalImages = files.additionalImages.map((file, index) => ({
        url: `/uploads/ideas/${file.filename}`,
        caption: req.body[`imageCaption${index}`] || '',
        uploadedAt: new Date()
      }));
      updates.additionalImages = [...(idea.additionalImages || []), ...additionalImages];
    }

    if (files.projectPdf && files.projectPdf[0]) {
      const pdfFile = files.projectPdf[0];
      updates.projectPdf = {
        filename: pdfFile.filename,
        originalName: pdfFile.originalname,
        path: `/uploads/pdfs/${pdfFile.filename}`,
        size: pdfFile.size,
        uploadedAt: new Date()
      };
    }

    // Parse JSON fields
    const parseJsonField = (field) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return field;
        }
      }
      return field;
    };

    // Parse JSON fields in updates
    ['tags', 'relatedLinks', 'requiredSkills', 'scope', 'futureEnhancements'].forEach(field => {
      if (updates[field]) {
        updates[field] = parseJsonField(updates[field]);
      }
    });

    ['estimatedDuration', 'currentResearch'].forEach(field => {
      if (updates[field]) {
        updates[field] = parseJsonField(updates[field]);
      }
    });

    const updatedIdea = await Idea.findByIdAndUpdate(
      ideaId,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'domain', select: 'title slug imageUrl' },
      { path: 'author', select: 'authorName profileImage phone socialMedia' },
      { path: 'createdBy', select: 'username fullName profileImage' }
    ]);

    res.json({
      success: true,
      message: 'Idea updated successfully',
      data: { idea: updatedIdea }
    });

  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete idea
exports.deleteIdea = async (req, res) => {
  try {
    const { ideaId } = req.params;

    const idea = await Idea.findById(ideaId);
    
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Check permissions
    if (idea.createdBy.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this idea'
      });
    }

    // Soft delete - mark as inactive
    idea.isActive = false;
    await idea.save();

    // Update related stats
    const [domain, author] = await Promise.all([
      Domain.findById(idea.domain),
      Author.findById(idea.author)
    ]);

    if (domain) {
      domain.stats.totalIdeas = Math.max(0, domain.stats.totalIdeas - 1);
      await domain.save();
    }

    if (author) {
      author.stats.totalIdeas = Math.max(0, author.stats.totalIdeas - 1);
      author.ideas.pull(ideaId);
      await author.save();
    }

    res.json({
      success: true,
      message: 'Idea deleted successfully'
    });

  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle like on idea
exports.toggleLike = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { ideaId } = req.params;

    const idea = await Idea.findById(ideaId);
    
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    const isLiked = idea.toggleLike(req.userId);
    await idea.save();

    res.json({
      success: true,
      message: isLiked ? 'Idea liked' : 'Idea unliked',
      data: {
        isLiked,
        likeCount: idea.likeCount
      }
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Express collaboration interest
exports.expressCollaborationInterest = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { ideaId } = req.params;
    const { message, skills } = req.body;

    const idea = await Idea.findById(ideaId);
    
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Check if user already expressed interest
    const existingInterest = idea.collaborationInterests.find(
      ci => ci.user.toString() === req.userId
    );

    if (existingInterest) {
      return res.status(400).json({
        success: false,
        message: 'You have already expressed interest in this idea'
      });
    }

    // Add collaboration interest
    idea.collaborationInterests.push({
      user: req.userId,
      message: message || '',
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      status: 'pending'
    });

    await idea.save();

    res.status(201).json({
      success: true,
      message: 'Collaboration interest expressed successfully',
      data: {
        collaborationCount: idea.collaborationCount
      }
    });

  } catch (error) {
    console.error('Express collaboration interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Manage collaboration interest (accept/decline)
exports.manageCollaborationInterest = async (req, res) => {
  try {
    const { ideaId, interestId } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "declined"'
      });
    }

    const idea = await Idea.findById(ideaId);
    
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Check if user is the idea creator
    if (idea.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the idea creator can manage collaboration interests'
      });
    }

    // Find and update the collaboration interest
    const interest = idea.collaborationInterests.id(interestId);
    
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration interest not found'
      });
    }

    interest.status = status;
    await idea.save();

    res.json({
      success: true,
      message: `Collaboration interest ${status} successfully`,
      data: {
        collaborationCount: idea.collaborationCount
      }
    });

  } catch (error) {
    console.error('Manage collaboration interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get trending ideas
exports.getTrendingIdeas = async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const trendingIdeas = await Idea.getTrending(parseInt(days), parseInt(limit));

    res.json({
      success: true,
      data: {
        ideas: trendingIdeas,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Get trending ideas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search ideas
exports.searchIdeas = async (req, res) => {
  try {
    const { q: query, domain, difficulty, category, status, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = { isActive: true, isPublic: true, moderationStatus: 'approved' };
    if (domain) filters.domain = domain;
    if (difficulty) filters.difficulty = difficulty;
    if (category) filters.category = category;
    if (status) filters.status = status;

    const ideas = await Idea.searchIdeas(query, filters, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        ideas,
        query,
        filters: { domain, difficulty, category, status },
        pagination: {
          current: parseInt(page),
          count: ideas.length
        }
      }
    });

  } catch (error) {
    console.error('Search ideas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get ideas by domain
exports.getIdeasByDomain = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { difficulty, status, page = 1, limit = 20, sort = 'createdAt' } = req.query;

    // Verify domain exists
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const filter = { 
      domain: domainId, 
      isActive: true, 
      isPublic: true,
      moderationStatus: 'approved'
    };

    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    if (status) {
      filter.status = status;
    }

    const ideas = await Idea.find(filter)
      .populate('author', 'authorName profileImage phone socialMedia')
      .populate('createdBy', 'username fullName profileImage')
      .sort({ [sort]: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Idea.countDocuments(filter);

    res.json({
      success: true,
      data: {
        domain: {
          id: domain._id,
          title: domain.title,
          description: domain.description,
          imageUrl: domain.imageUrl
        },
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
    console.error('Get ideas by domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};