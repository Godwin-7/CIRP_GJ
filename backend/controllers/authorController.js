const { validationResult } = require('express-validator');
const Author = require('../models/Author');
const User = require('../models/User');

// Get all authors
exports.getAllAuthors = async (req, res) => {
  try {
    const { 
      search, 
      researchArea,
      verified,
      page = 1, 
      limit = 20,
      sort = 'totalIdeas'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (verified !== undefined) {
      filter.isVerified = verified === 'true';
    }

    if (researchArea) {
      filter.researchAreas = { $in: [new RegExp(researchArea, 'i')] };
    }

    // Build query
    let query;
    
    if (search) {
      query = Author.searchAuthors(search, filter, {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        sort: { [`stats.${sort}`]: -1 }
      });
    } else {
      query = Author.find(filter)
        .select('authorName title organization bio profileImage researchAreas isVerified stats joinedAt')
        .sort({ [`stats.${sort}`]: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    }

    const authors = await query;
    
    // Get total count for pagination
    const total = await Author.countDocuments(filter);

    res.json({
      success: true,
      data: {
        authors,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: authors.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get all authors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get author by ID
exports.getAuthorById = async (req, res) => {
  try {
    const { authorId } = req.params;

    const author = await Author.findById(authorId)
      .populate('ideas', 'title description projectImage difficulty status createdAt')
      .populate('userId', 'username fullName profileImage');

    if (!author || !author.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Get public profile based on privacy settings
    const publicProfile = author.getPublicProfile();

    // Add populated ideas
    publicProfile.ideas = author.ideas.filter(idea => idea.isActive);

    res.json({
      success: true,
      data: { author: publicProfile }
    });

  } catch (error) {
    console.error('Get author by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new author
exports.createAuthor = async (req, res) => {
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
      authorName,
      authorEmail,
      phone,
      bio,
      title,
      organization,
      department,
      position,
      researchAreas,
      expertise,
      education,
      socialMedia,
      collaborationPreferences,
      topics
    } = req.body;

    // Check if author with same email exists
    const existingAuthor = await Author.findOne({ authorEmail });
    if (existingAuthor) {
      return res.status(400).json({
        success: false,
        message: 'Author with this email already exists'
      });
    }

    // Handle profile image upload
    let profileImage = '/uploads/defaults/default-author.png';
    if (req.file) {
      profileImage = `/uploads/authors/${req.file.filename}`;
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

    // Create author
    const author = new Author({
      authorName,
      authorEmail,
      phone,
      profileImage,
      bio,
      title,
      organization,
      department,
      position,
      contactInfo: {
        email: authorEmail,
        phone,
        alternateEmail: req.body.alternateEmail,
        website: req.body.website,
        linkedin: req.body.linkedin,
        orcid: req.body.orcid,
        researchGate: req.body.researchGate
      },
      researchAreas: parseJsonField(researchAreas),
      expertise: parseJsonField(expertise),
      education: parseJsonField(education),
      socialMedia: parseJsonField(socialMedia),
      collaborationPreferences: parseJsonField(collaborationPreferences),
      topics: parseJsonField(topics),
      userId: req.userId // Link to the user who created this author profile
    });

    await author.save();

    res.status(201).json({
      success: true,
      message: 'Author created successfully',
      data: { author: author.getPublicProfile() }
    });

  } catch (error) {
    console.error('Create author error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update author
exports.updateAuthor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { authorId } = req.params;
    const updates = req.body;

    const author = await Author.findById(authorId);
    
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Check permissions (only author creator or admin can update)
    if (author.userId && author.userId.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this author profile'
      });
    }

    // Handle profile image update
    if (req.file) {
      updates.profileImage = `/uploads/authors/${req.file.filename}`;
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
    ['researchAreas', 'expertise', 'education', 'socialMedia', 'collaborationPreferences', 'topics'].forEach(field => {
      if (updates[field]) {
        updates[field] = parseJsonField(updates[field]);
      }
    });

    // Update contact info if email changed
    if (updates.authorEmail) {
      updates['contactInfo.email'] = updates.authorEmail;
    }

    if (updates.phone) {
      updates['contactInfo.phone'] = updates.phone;
    }

    // Update last profile update timestamp
    updates.lastProfileUpdate = new Date();

    const updatedAuthor = await Author.findByIdAndUpdate(
      authorId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Author updated successfully',
      data: { author: updatedAuthor.getPublicProfile() }
    });

  } catch (error) {
    console.error('Update author error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete author
exports.deleteAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;

    const author = await Author.findById(authorId);
    
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Check permissions
    if (author.userId && author.userId.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this author profile'
      });
    }

    // Check if author has ideas
    if (author.ideas && author.ideas.length > 0) {
      // Soft delete - just mark as inactive
      author.isActive = false;
      await author.save();
      
      return res.json({
        success: true,
        message: 'Author profile archived successfully (has associated ideas)'
      });
    }

    // Hard delete if no ideas
    await Author.findByIdAndDelete(authorId);

    res.json({
      success: true,
      message: 'Author deleted successfully'
    });

  } catch (error) {
    console.error('Delete author error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get author by topic
exports.getAuthorByTopic = async (req, res) => {
  try {
    const { topic } = req.params;

    const authors = await Author.findByTopic(topic)
      .select('authorName profileImage bio researchAreas isVerified stats')
      .limit(10);

    if (authors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No authors found for this topic'
      });
    }

    // For compatibility with frontend, return first author's name
    const primaryAuthor = authors[0];

    res.json({
      success: true,
      data: {
        authorName: primaryAuthor.authorName,
        authors: authors // Full list of matching authors
      }
    });

  } catch (error) {
    console.error('Get author by topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search authors
exports.searchAuthors = async (req, res) => {
  try {
    const { q: query, researchArea, organization, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = { isActive: true };
    if (researchArea) {
      filters.researchAreas = { $in: [new RegExp(researchArea, 'i')] };
    }
    if (organization) {
      filters.organization = new RegExp(organization, 'i');
    }

    const authors = await Author.searchAuthors(query, filters, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        authors,
        query,
        filters: { researchArea, organization },
        pagination: {
          current: parseInt(page),
          count: authors.length
        }
      }
    });

  } catch (error) {
    console.error('Search authors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get top authors
exports.getTopAuthors = async (req, res) => {
  try {
    const { criteria = 'ideas', limit = 10 } = req.query;

    const validCriteria = ['ideas', 'likes', 'views'];
    if (!validCriteria.includes(criteria)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid criteria. Must be one of: ideas, likes, views'
      });
    }

    const authors = await Author.getTopAuthors(criteria, parseInt(limit));

    res.json({
      success: true,
      data: {
        authors,
        criteria,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get top authors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update author stats (internal method)
exports.updateAuthorStats = async (authorId, field, increment = 1) => {
  try {
    const updateField = {};
    updateField[`stats.${field}`] = increment;

    await Author.findByIdAndUpdate(
      authorId,
      { $inc: updateField },
      { new: true }
    );

  } catch (error) {
    console.error('Update author stats error:', error);
  }
};

// Get author collaboration preferences
exports.getAuthorCollaborationInfo = async (req, res) => {
  try {
    const { authorId } = req.params;

    const author = await Author.findById(authorId)
      .select('authorName profileImage bio collaborationPreferences contactInfo privacy');

    if (!author || !author.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Check if author is available for collaboration
    if (!author.isAvailableForCollaboration()) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          message: 'Author is currently not available for collaboration'
        }
      });
    }

    // Return collaboration info based on privacy settings
    const collaborationInfo = {
      authorName: author.authorName,
      profileImage: author.profileImage,
      bio: author.bio,
      available: true,
      preferences: author.collaborationPreferences
    };

    // Add contact info if privacy allows
    if (author.privacy.allowDirectContact) {
      if (author.privacy.showEmail) {
        collaborationInfo.email = author.contactInfo.email;
      }
      if (author.privacy.showPhone) {
        collaborationInfo.phone = author.contactInfo.phone;
      }
    }

    res.json({
      success: true,
      data: collaborationInfo
    });

  } catch (error) {
    console.error('Get author collaboration info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify author
exports.verifyAuthor = async (req, res) => {
  try {
    // Only admins can verify authors
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can verify authors'
      });
    }

    const { authorId } = req.params;
    const { verificationMethod = 'manual' } = req.body;

    const author = await Author.findById(authorId);
    
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    author.isVerified = true;
    author.verificationMethod = verificationMethod;
    await author.save();

    res.json({
      success: true,
      message: 'Author verified successfully',
      data: { author: author.getPublicProfile() }
    });

  } catch (error) {
    console.error('Verify author error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get authors by research area
exports.getAuthorsByResearchArea = async (req, res) => {
  try {
    const { researchArea } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const authors = await Author.find({
      researchAreas: { $in: [new RegExp(researchArea, 'i')] },
      isActive: true
    })
    .select('authorName title organization profileImage bio researchAreas isVerified stats')
    .sort({ 'stats.totalIdeas': -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Author.countDocuments({
      researchAreas: { $in: [new RegExp(researchArea, 'i')] },
      isActive: true
    });

    res.json({
      success: true,
      data: {
        researchArea,
        authors,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: authors.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get authors by research area error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};