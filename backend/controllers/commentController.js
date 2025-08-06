const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Idea = require('../models/Idea');
const Domain = require('../models/Domain');

// Get comments for a target (idea, domain, etc.)
exports.getComments = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sort = 'createdAt',
      order = 'desc',
      includeReplies = false
    } = req.query;

    // Validate target type
    const validTargetTypes = ['idea', 'domain'];
    if (!validTargetTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
    }

    // Verify target exists
    let target;
    if (targetType === 'idea') {
      target = await Idea.findById(targetId);
    } else if (targetType === 'domain') {
      target = await Domain.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} not found`
      });
    }

    const options = {
      includeReplies: includeReplies === 'true',
      sort: order === 'desc' ? -1 : 1,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      replyLimit: 5
    };

    const comments = await Comment.getCommentsForTarget(targetType, targetId, options);
    
    // Get total count
    const total = await Comment.countDocuments({
      targetType,
      targetId,
      isDeleted: false,
      status: 'active',
      parentComment: null // Only count root comments
    });

    res.json({
      success: true,
      data: {
        comments,
        target: {
          type: targetType,
          id: targetId,
          title: target.title
        },
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: comments.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new comment
exports.createComment = async (req, res) => {
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

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { targetType, targetId } = req.params;
    const { content, parentCommentId } = req.body;

    // Validate target type
    const validTargetTypes = ['idea', 'domain'];
    if (!validTargetTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
    }

    // Verify target exists
    let target;
    let targetModel;
    
    if (targetType === 'idea') {
      target = await Idea.findById(targetId);
      targetModel = 'Idea';
    } else if (targetType === 'domain') {
      target = await Domain.findById(targetId);
      targetModel = 'Domain';
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} not found`
      });
    }

    let comment;
    let threadLevel = 0;

    // Handle reply to existing comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Create reply using parent comment's method
      const replyData = parentComment.addReply({
        content,
        author: req.userId,
        targetType: 'comment',
        targetId: parentCommentId,
        targetModel: 'Comment'
      });

      comment = new Comment(replyData);
      threadLevel = replyData.threadLevel;

    } else {
      // Create root comment
      comment = new Comment({
        content,
        author: req.userId,
        targetType,
        targetId,
        targetModel,
        threadLevel: 0
      });
    }

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      comment.attachments = req.files.map(file => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
        url: `/uploads/comments/${file.filename}`,
        filename: file.filename,
        size: file.size
      }));
    }

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length > 0) {
      // Find mentioned users (simplified - in real app you'd want better user matching)
      const User = require('../models/User');
      const mentionedUsers = await User.find({ 
        username: { $in: mentions } 
      }).select('_id');
      
      comment.mentions = mentionedUsers.map(user => user._id);
    }

    await comment.save();

    // Update target's comment count
    if (targetType === 'idea') {
      target.stats.totalComments += 1;
      await target.save();
    }

    // Populate the created comment
    await comment.populate([
      { path: 'author', select: 'username fullName profileImage' },
      { path: 'mentions', select: 'username fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: threadLevel > 0 ? 'Reply added successfully' : 'Comment added successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check permissions (only comment author can edit)
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    // Check if comment is too old to edit (optional: 24 hours limit)
    const editTimeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - comment.createdAt.getTime() > editTimeLimit) {
      return res.status(400).json({
        success: false,
        message: 'Comment is too old to edit'
      });
    }

    // Update comment using the editMessage method
    await comment.editMessage(content);

    // Populate updated comment
    await comment.populate('author', 'username fullName profileImage');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check permissions (comment author or admin can delete)
    if (comment.author.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete the comment
    await comment.softDelete();

    // Update target's comment count if it's a root comment
    if (!comment.parentComment) {
      if (comment.targetType === 'idea') {
        const idea = await Idea.findById(comment.targetId);
        if (idea) {
          idea.stats.totalComments = Math.max(0, idea.stats.totalComments - 1);
          await idea.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle like on comment
exports.toggleLike = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    const isLiked = comment.toggleLike(req.userId);
    await comment.save();

    res.json({
      success: true,
      message: isLiked ? 'Comment liked' : 'Comment unliked',
      data: {
        isLiked,
        likeCount: comment.likeCount
      }
    });

  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get comment thread (comment with all its replies)
exports.getCommentThread = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { maxDepth = 3 } = req.query;

    const commentThread = await Comment.getCommentThread(commentId, parseInt(maxDepth));
    
    if (!commentThread) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      data: { comment: commentThread }
    });

  } catch (error) {
    console.error('Get comment thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Flag comment
exports.flagComment = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { commentId } = req.params;
    const { reason, description } = req.body;

    const validReasons = ['spam', 'inappropriate', 'harassment', 'misinformation', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flag reason'
      });
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Don't allow users to flag their own comments
    if (comment.author.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot flag your own comment'
      });
    }

    await comment.addFlag(req.userId, reason, description);

    res.json({
      success: true,
      message: 'Comment flagged successfully'
    });

  } catch (error) {
    console.error('Flag comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search comments
exports.searchComments = async (req, res) => {
  try {
    const { q: query, targetType, targetId, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = {};
    if (targetType) filters.targetType = targetType;
    if (targetId) filters.targetId = targetId;

    const comments = await Comment.searchComments(query, filters, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        comments,
        query,
        filters,
        pagination: {
          current: parseInt(page),
          count: comments.length
        }
      }
    });

  } catch (error) {
    console.error('Search comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's comments
exports.getUserComments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, targetType } = req.query;

    const filter = {
      author: userId,
      isDeleted: false,
      status: 'active'
    };

    if (targetType) {
      filter.targetType = targetType;
    }

    const comments = await Comment.find(filter)
      .populate('author', 'username fullName profileImage')
      .populate('targetId') // This will populate the target (idea/domain)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Comment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: comments.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};