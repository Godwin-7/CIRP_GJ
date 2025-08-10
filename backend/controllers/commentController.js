const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Idea = require('../models/Idea');
const Domain = require('../models/Domain');

// Get MAIN comments only (no replies) - YouTube style
exports.getMainComments = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sort = 'createdAt',
      order = 'desc'
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

    // Get ONLY main comments (parentComment: null)
    const comments = await Comment.find({
      targetType,
      targetId,
      isDeleted: false,
      status: 'active',
      isApproved: true,
      parentComment: null // This is the key - only root comments
    })
    .populate('author', 'username fullName profileImage')
    .sort({ [sort]: order === 'desc' ? -1 : 1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean(); // Use lean for better performance

    // Get total count of main comments only
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
    console.error('Get main comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get replies for a specific comment - YouTube style "View Replies"
exports.getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // First, get the parent comment to verify it exists
    const parentComment = await Comment.findById(commentId)
      .populate('author', 'username fullName profileImage');
    
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Get all replies to this comment
    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false,
      status: 'active',
      isApproved: true
    })
    .populate('author', 'username fullName profileImage')
    .sort({ createdAt: 1 }) // Replies in chronological order
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

    // Get total count of replies
    const totalReplies = await Comment.countDocuments({
      parentComment: commentId,
      isDeleted: false,
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        comment: parentComment,
        replies,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalReplies / parseInt(limit)),
          count: replies.length,
          totalItems: totalReplies
        }
      }
    });

  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new comment (main or reply)
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
    const { content, parentComment } = req.body; // parentComment instead of parentCommentId

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
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      
      if (!parentCommentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Limit nesting depth
      if (parentCommentDoc.threadLevel >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum reply depth reached'
        });
      }

      threadLevel = parentCommentDoc.threadLevel + 1;

      comment = new Comment({
        content,
        author: req.userId,
        targetType,
        targetId,
        targetModel,
        parentComment,
        threadLevel
      });

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
      const User = require('../models/User');
      const mentionedUsers = await User.find({ 
        username: { $in: mentions } 
      }).select('_id');
      
      comment.mentions = mentionedUsers.map(user => user._id);
    }

    await comment.save();

    // Update parent comment's reply count if this is a reply
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $inc: { replyCount: 1 },
        $addToSet: { replies: comment._id }
      });
    }

    // Update target's comment count (only for main comments)
    if (targetType === 'idea' && !parentComment) {
      target.stats = target.stats || {};
      target.stats.totalComments = (target.stats.totalComments || 0) + 1;
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

    // Save edit history
    if (!comment.editHistory) comment.editHistory = [];
    comment.editHistory.push({
      content: comment.content,
      editedAt: new Date()
    });

    // Update content
    comment.content = content;
    comment.isEdited = true;
    await comment.save();

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
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.content = '[Comment deleted]';
    comment.status = 'deleted';
    await comment.save();

    // Update parent comment's reply count if this is a reply
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { replyCount: -1 },
        $pull: { replies: comment._id }
      });
    }

    // Update target's comment count if it's a root comment
    if (!comment.parentComment) {
      if (comment.targetType === 'idea') {
        const idea = await Idea.findById(comment.targetId);
        if (idea && idea.stats) {
          idea.stats.totalComments = Math.max(0, (idea.stats.totalComments || 0) - 1);
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

    const existingLike = comment.likes.find(like => like.user.toString() === req.userId);
    
    let isLiked;
    if (existingLike) {
      // Remove like
      comment.likes.pull(existingLike._id);
      isLiked = false;
    } else {
      // Add like
      comment.likes.push({ user: req.userId });
      isLiked = true;
    }

    comment.likeCount = comment.likes.length;
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

    // Check if user already flagged this comment
    const existingFlag = comment.flags.find(flag => flag.user.toString() === req.userId);
    if (existingFlag) {
      return res.status(400).json({
        success: false,
        message: 'You have already flagged this comment'
      });
    }

    comment.flags.push({
      user: req.userId,
      reason,
      description
    });

    // Auto-flag if too many flags
    if (comment.flags.length >= 5) {
      comment.status = 'flagged';
    }

    await comment.save();

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

    const searchRegex = new RegExp(query, 'i');
    const filter = {
      content: searchRegex,
      isDeleted: false,
      status: 'active',
      isApproved: true
    };

    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;

    const comments = await Comment.find(filter)
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        comments,
        query,
        filters: { targetType, targetId },
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