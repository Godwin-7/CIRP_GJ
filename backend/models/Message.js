const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  // Basic message info - supporting both old and new formats
  content: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  message: { // Legacy field for backward compatibility
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Author info
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Message context
  messageType: {
    type: String,
    enum: ['global', 'domain', 'private', 'system'],
    default: 'global'
  },
  
  // Domain-specific chat
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    default: null
  },
  
  // Private messaging
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Legacy timestamp field
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Message features
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
  
  // Reactions/Emojis
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      reactedAt: {
        type: Date,
        default: Date.now
      }
    }],
    count: {
      type: Number,
      default: 0
    }
  }],
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'deleted', 'flagged'],
    default: 'sent'
  },
  
  // For private messages
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Moderation
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Flags and reports
  flags: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'off-topic', 'other']
    },
    description: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Mentions
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    position: Number
  }],
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'link']
    },
    url: String,
    filename: String,
    originalName: String,
    size: Number,
    mimeType: String
  }],
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Thread information
  threadId: {
    type: String,
    default: null
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  
  // Delivery info
  deliveredTo: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to ensure content compatibility
messageSchema.pre('save', function(next) {
  // If message field is set but content is not, copy it
  if (this.message && !this.content) {
    this.content = this.message;
  }
  // If content field is set but message is not, copy it for backward compatibility
  if (this.content && !this.message) {
    this.message = this.content;
  }
  
  // Ensure we have at least one content field
  if (!this.content && !this.message) {
    return next(new Error('Message content is required'));
  }
  
  // Update reaction counts
  this.reactions.forEach(reaction => {
    reaction.count = reaction.users.length;
  });
  
  next();
});

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  const timestamp = this.timestamp || this.createdAt;
  return timestamp ? timestamp.toLocaleString() : '';
});

// Virtual for time ago
messageSchema.virtual('timeAgo').get(function() {
  const timestamp = this.timestamp || this.createdAt;
  if (!timestamp) return '';
  
  const now = new Date();
  const diffTime = Math.abs(now - timestamp);
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
});

// Instance method to add reaction
messageSchema.methods.addReaction = function(emoji, userId, username) {
  let reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (!reaction) {
    reaction = {
      emoji,
      users: [],
      count: 0
    };
    this.reactions.push(reaction);
  }
  
  const existingReaction = reaction.users.find(u => u.userId.toString() === userId.toString());
  
  if (existingReaction) {
    reaction.users.pull(existingReaction._id);
    if (reaction.users.length === 0) {
      this.reactions.pull(reaction._id);
    }
    return false;
  } else {
    reaction.users.push({
      userId,
      username
    });
    return true;
  }
};

// Instance method to edit message
messageSchema.methods.editMessage = function(newContent) {
  const oldContent = this.content || this.message;
  if (oldContent !== newContent) {
    this.editHistory.push({
      content: oldContent
    });
    
    this.content = newContent;
    this.message = newContent; // Keep both for compatibility
    this.isEdited = true;
  }
  
  return this.save();
};

// Instance method to soft delete
messageSchema.methods.softDelete = function(deletedBy = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.status = 'deleted';
  this.content = '[Message deleted]';
  this.message = '[Message deleted]';
  
  return this.save();
};

// Instance method to flag message
messageSchema.methods.addFlag = function(userId, reason, description = '') {
  const existingFlag = this.flags.find(flag => flag.userId.toString() === userId.toString());
  
  if (!existingFlag) {
    this.flags.push({
      userId,
      reason,
      description
    });
    
    if (this.flags.length >= 3) {
      this.status = 'flagged';
    }
  }
  
  return this.save();
};

// Static method to get global chat messages
messageSchema.statics.getGlobalMessages = function(limit = 50, skip = 0) {
  return this.find({
    $or: [
      { messageType: 'global' },
      { messageType: { $exists: false } }, // Legacy messages
      { domainId: null },
      { domainId: { $exists: false } }
    ],
    isDeleted: false,
    status: { $ne: 'flagged' }
  })
  .populate('userId', 'username fullName profileImage')
  .sort({ timestamp: -1, createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get domain chat messages
messageSchema.statics.getDomainMessages = function(domainId, limit = 50, skip = 0) {
  return this.find({
    messageType: 'domain',
    domainId,
    isDeleted: false,
    status: { $ne: 'flagged' }
  })
  .populate('userId', 'username fullName profileImage')
  .populate('domainId', 'title')
  .sort({ timestamp: -1, createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get private messages between users
messageSchema.statics.getPrivateMessages = function(userId1, userId2, limit = 50, skip = 0) {
  return this.find({
    messageType: 'private',
    isDeleted: false,
    $or: [
      { userId: userId1, recipient: userId2 },
      { userId: userId2, recipient: userId1 }
    ]
  })
  .populate('userId', 'username fullName profileImage')
  .populate('recipient', 'username fullName profileImage')
  .sort({ timestamp: 1, createdAt: 1 })
  .limit(limit)
  .skip(skip);
};

// Static method to search messages
messageSchema.statics.searchMessages = function(query, filters = {}, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  const filter = {
    $or: [
      { content: searchRegex },
      { message: searchRegex } // Search both fields
    ],
    isDeleted: false,
    status: { $ne: 'flagged' },
    ...filters
  };

  return this.find(filter)
    .populate('userId', 'username fullName profileImage')
    .populate('domainId', 'title')
    .sort(options.sort || { timestamp: -1, createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(messageIds, userId) {
  return this.updateMany(
    { 
      _id: { $in: messageIds },
      recipient: userId,
      isRead: false
    },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
};

// Indexes for better performance
messageSchema.index({ messageType: 1, timestamp: -1, createdAt: -1 });
messageSchema.index({ domainId: 1, timestamp: -1, createdAt: -1 });
messageSchema.index({ userId: 1, timestamp: -1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ content: 'text', message: 'text' });
messageSchema.index({ status: 1, isDeleted: 1 });
messageSchema.index({ threadId: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;