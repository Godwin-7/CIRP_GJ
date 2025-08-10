// routes/comments.js - Final Clean Version
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const Comment = require('../models/Comment');
const Idea = require('../models/Idea');
const Domain = require('../models/Domain');

// ===== MAIN COMMENT ROUTES (YouTube Style) =====

// Get main comments for an idea (no replies) - YouTube style
router.get('/idea/:ideaId', async (req, res) => {
  try {
    const { ideaId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify idea exists
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    // Get ONLY main comments (parentComment: null)
    const comments = await Comment.find({
      targetType: 'idea',
      targetId: ideaId,
      isDeleted: false,
      status: 'active',
      isApproved: true,
      parentComment: null // Key: Only root comments
    })
    .populate('author', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          count: comments.length
        }
      }
    });

  } catch (error) {
    console.error('Get idea comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get replies for a specific comment - YouTube "View Replies" functionality
router.get('/thread/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // Get the parent comment
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
    .sort({ createdAt: 1 }); // Chronological order for replies

    res.json({
      success: true,
      data: {
        comment: parentComment,
        replies
      }
    });

  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new comment or reply
router.post('/idea/:ideaId', authenticate, async (req, res) => {
  try {
    const { ideaId } = req.params;
    const { content, parentComment } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Verify idea exists
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Idea not found'
      });
    }

    let newComment;

    if (parentComment) {
      // Creating a reply
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      newComment = new Comment({
        content: content.trim(),
        author: req.userId,
        targetType: 'idea',
        targetId: ideaId,
        targetModel: 'Idea',
        parentComment,
        threadLevel: (parentCommentDoc.threadLevel || 0) + 1
      });

      // Update parent comment's reply count
      await Comment.findByIdAndUpdate(parentComment, {
        $inc: { replyCount: 1 }
      });

    } else {
      // Creating a main comment
      newComment = new Comment({
        content: content.trim(),
        author: req.userId,
        targetType: 'idea',
        targetId: ideaId,
        targetModel: 'Idea',
        threadLevel: 0
      });

      // Update idea's comment count
      if (idea.stats) {
        idea.stats.totalComments = (idea.stats.totalComments || 0) + 1;
      } else {
        idea.stats = { totalComments: 1 };
      }
      await idea.save();
    }

    await newComment.save();

    // Populate the created comment
    await newComment.populate('author', 'username fullName profileImage');

    res.status(201).json({
      success: true,
      message: parentComment ? 'Reply added successfully' : 'Comment added successfully',
      data: { comment: newComment }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===== DOMAIN COMMENT ROUTES =====

// Get main comments for a domain
router.get('/domain/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify domain exists
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Get ONLY main comments (parentComment: null)
    const comments = await Comment.find({
      targetType: 'domain',
      targetId: domainId,
      isDeleted: false,
      status: 'active',
      isApproved: true,
      parentComment: null
    })
    .populate('author', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          count: comments.length
        }
      }
    });

  } catch (error) {
    console.error('Get domain comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create comment for domain
router.post('/domain/:domainId', authenticate, async (req, res) => {
  try {
    const { domainId } = req.params;
    const { content, parentComment } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Verify domain exists
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    let newComment;

    if (parentComment) {
      // Creating a reply
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      newComment = new Comment({
        content: content.trim(),
        author: req.userId,
        targetType: 'domain',
        targetId: domainId,
        targetModel: 'Domain',
        parentComment,
        threadLevel: (parentCommentDoc.threadLevel || 0) + 1
      });

      // Update parent comment's reply count
      await Comment.findByIdAndUpdate(parentComment, {
        $inc: { replyCount: 1 }
      });

    } else {
      // Creating a main comment
      newComment = new Comment({
        content: content.trim(),
        author: req.userId,
        targetType: 'domain',
        targetId: domainId,
        targetModel: 'Domain',
        threadLevel: 0
      });
    }

    await newComment.save();

    // Populate the created comment
    await newComment.populate('author', 'username fullName profileImage');

    res.status(201).json({
      success: true,
      message: parentComment ? 'Reply added successfully' : 'Comment added successfully',
      data: { comment: newComment }
    });

  } catch (error) {
    console.error('Create domain comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===== COMMENT MANAGEMENT ROUTES =====

// Delete comment
router.delete('/:commentId', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check permissions
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.content = '[Comment deleted]';
    comment.status = 'deleted';
    await comment.save();

    // Update parent comment's reply count if this is a reply
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { replyCount: -1 }
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Like/Unlike comment
router.post('/:commentId/like', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const existingLike = comment.likes.find(like => 
      like.user.toString() === req.userId
    );
    
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
      message: 'Server error'
    });
  }
});

module.exports = router;