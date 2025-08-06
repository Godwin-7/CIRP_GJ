const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Author information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // What this comment is attached to
  targetType: {
    type: String,
    required: true,
    enum: ['idea', 'domain', 'comment'] // comment for replies
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Idea', 'Domain', 'Comment']
  },
  
  // Reply system
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  
  // Thread level (0 = root comment, 1 = first level reply, etc.)
  threadLevel: {
    type: Number,
    default: 0,
    max: 5 // Limit nesting to prevent infinite depth
  },
  
  // Interaction data
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  
  // Moderation
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  
  // Status and visibility
  status: {
    type: String,
    enum: ['active', 'hidden', 'flagged', 'spam'],
    default: 'active'
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  moderationNotes: String,
  
  // Flags and reports
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'misinformation', 'other']
    },
    description: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Attachments (optional)
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link']
    },
    url: String,
    filename: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Update like count before saving
commentSchema.pre('save', function(next) {
  this.likeCount = this.likes.length;
  next();
});

// Update parent comment reply count when a reply is added/removed
commentSchema.post('save', async function(doc) {
  if (doc.parentComment) {
    const Comment = mongoose.model('Comment');
    const replyCount = await Comment.countDocuments({ 
      parentComment: doc.parentComment,
      isDeleted: false 
    });
    
    await Comment.findByIdAndUpdate(doc.parentComment, { 
      replyCount,
      $addToSet: { replies: doc._id }
    });
  }
});

// Virtual for formatted creation time
commentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Instance method to check if user liked the comment
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Instance method to toggle like
commentSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.likes.pull(existingLike._id);
    return false; // unliked
  } else {
    this.likes.push({ user: userId });
    return true; // liked
  }
};

// Instance method to add reply
commentSchema.methods.addReply = function(replyData) {
  replyData.parentComment = this._id;
  replyData.threadLevel = Math.min(this.threadLevel + 1, 5);
  replyData.targetType = 'comment';
  replyData.targetId = this._id;
  replyData.targetModel = 'Comment';
  
  return replyData;
};

// Instance method to soft delete
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[Comment deleted]';
  return this.save();
};

// Instance method to flag comment
commentSchema.methods.addFlag = function(userId, reason, description = '') {
  const existingFlag = this.flags.find(flag => flag.user.toString() === userId.toString());
  
  if (!existingFlag) {
    this.flags.push({
      user: userId,
      reason,
      description
    });
    
    // Auto-hide if too many flags
    if (this.flags.length >= 5) {
      this.status = 'flagged';
    }
  }
  
  return this.save();
};

// Static method to get comments for a target
commentSchema.statics.getCommentsForTarget = function(targetType, targetId, options = {}) {
  const query = {
    targetType,
    targetId,
    isDeleted: false,
    status: 'active',
    isApproved: true
  };
  
  // Only get root comments unless specifically asking for replies
  if (!options.includeReplies) {
    query.parentComment = null;
  }
  
  return this.find(query)
    .populate('author', 'username fullName profileImage')
    .populate({
      path: 'replies',
      match: { isDeleted: false, status: 'active' },
      populate: {
        path: 'author',
        select: 'username fullName profileImage'
      },
      options: { 
        sort: { createdAt: options.replySort || 1 },
        limit: options.replyLimit || 5
      }
    })
    .sort({ createdAt: options.sort || -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get comment thread
commentSchema.statics.getCommentThread = function(commentId, maxDepth = 3) {
  return this.findById(commentId)
    .populate({
      path: 'replies',
      match: { isDeleted: false, status: 'active' },
      populate: {
        path: 'author replies',
        select: 'username fullName profileImage',
        populate: {
          path: 'author',
          select: 'username fullName profileImage'
        }
      },
      options: { sort: { createdAt: 1 } }
    })
    .populate('author', 'username fullName profileImage');
};

// Static method to search comments
commentSchema.statics.searchComments = function(query, filters = {}, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  const filter = {
    content: searchRegex,
    isDeleted: false,
    status: 'active',
    isApproved: true,
    ...filters
  };

  return this.find(filter)
    .populate('author', 'username fullName profileImage')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Indexes for better performance
commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, threadLevel: 1 });
commentSchema.index({ status: 1, isApproved: 1, isDeleted: 1 });
commentSchema.index({ content: 'text' });
commentSchema.index({ createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;