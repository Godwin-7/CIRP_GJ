const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  detailedDescription: {
    type: String,
    trim: true,
    maxlength: [10000, 'Detailed description cannot exceed 10000 characters']
  },
  domain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: [true, 'Domain is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Author is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Difficulty must be easy, medium, or hard'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['Research', 'Development', 'Innovation', 'Improvement', 'Analysis', 'Other'],
    default: 'Research'
  },
  status: {
    type: String,
    enum: ['Not yet started', 'In progress', 'Collaboration needed', 'Completed', 'On hold', 'Cancelled'],
    default: 'Not yet started'
  },
  projectImage: {
    type: String,
    default: '/uploads/defaults/default-project.png'
  },
  additionalImages: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  projectPdf: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  tags: [{
    type: String,
    trim: true
  }],
  relatedLinks: [{
    title: String,
    url: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    description: String,
    type: {
      type: String,
      enum: ['website', 'github', 'paper', 'video', 'documentation', 'other'],
      default: 'other'
    }
  }],
  requiredSkills: [{
    skill: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  }],
  estimatedDuration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'weeks'
    }
  },
  scope: {
    shortTerm: [String],
    longTerm: [String],
    limitations: [String],
    assumptions: [String]
  },
  currentResearch: {
    status: String,
    findings: [String],
    challenges: [String],
    nextSteps: [String]
  },
  futureEnhancements: [{
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    estimatedEffort: String
  }],
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
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    duration: Number, // in seconds
    source: String // referrer
  }],
  collaborationInterests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: String,
    skills: [String],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    expressedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  moderationNotes: String,
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    isFeatured: { type: Boolean, default: false },
    featuredAt: Date,
    featuredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  stats: {
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalCollaborationInterests: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
ideaSchema.index({ title: 'text', description: 'text', tags: 'text' });
ideaSchema.index({ domain: 1, difficulty: 1 });
ideaSchema.index({ author: 1 });
ideaSchema.index({ createdBy: 1 });
ideaSchema.index({ status: 1 });
ideaSchema.index({ category: 1 });
ideaSchema.index({ moderationStatus: 1, isActive: 1, isPublic: 1 });
ideaSchema.index({ createdAt: -1 });
ideaSchema.index({ 'stats.totalLikes': -1 });
ideaSchema.index({ 'stats.totalViews': -1 });

// Virtual properties
ideaSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

ideaSchema.virtual('viewCount').get(function() {
  return this.views ? this.views.length : 0;
});

ideaSchema.virtual('collaborationCount').get(function() {
  return this.collaborationInterests ? this.collaborationInterests.length : 0;
});

ideaSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Methods
ideaSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId);
};

ideaSchema.methods.toggleLike = function(userId) {
  const existingLikeIndex = this.likes.findIndex(like => 
    like.user.toString() === userId
  );
  
  if (existingLikeIndex > -1) {
    // Unlike
    this.likes.splice(existingLikeIndex, 1);
    this.stats.totalLikes = Math.max(0, this.stats.totalLikes - 1);
    return false;
  } else {
    // Like
    this.likes.push({ user: userId });
    this.stats.totalLikes += 1;
    return true;
  }
};

ideaSchema.methods.addView = function(userId, duration = 0, source = 'direct') {
  // Only add view if user hasn't viewed in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentView = this.views.find(view => 
    view.user.toString() === userId && view.viewedAt > oneHourAgo
  );
  
  if (!recentView) {
    this.views.push({ 
      user: userId, 
      duration, 
      source,
      viewedAt: new Date()
    });
    this.stats.totalViews += 1;
  }
};

ideaSchema.methods.canEdit = function(userId) {
  return this.createdBy.toString() === userId;
};

// Static methods
ideaSchema.statics.searchIdeas = function(query, filters = {}, options = {}) {
  const searchFilter = {
    ...filters,
    $text: { $search: query }
  };

  return this.find(searchFilter, { score: { $meta: "textScore" } })
    .populate('domain', 'title slug imageUrl')
    .populate('author', 'authorName profileImage')
    .populate('createdBy', 'username fullName profileImage')
    .sort({ score: { $meta: "textScore" } })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

ideaSchema.statics.getTrending = function(days = 7, limit = 10) {
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        isActive: true,
        isPublic: true,
        moderationStatus: 'approved',
        createdAt: { $gte: dateThreshold }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$stats.totalLikes', 3] },
            { $multiply: ['$stats.totalViews', 1] },
            { $multiply: ['$stats.totalComments', 5] },
            { $multiply: ['$stats.totalCollaborationInterests', 10] }
          ]
        }
      }
    },
    { $sort: { trendingScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'domains',
        localField: 'domain',
        foreignField: '_id',
        as: 'domain'
      }
    },
    {
      $lookup: {
        from: 'authors',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    { $unwind: '$domain' },
    { $unwind: '$author' }
  ]);
};

ideaSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ 
    'featured.isFeatured': true,
    isActive: true,
    isPublic: true,
    moderationStatus: 'approved'
  })
  .populate('domain', 'title slug imageUrl')
  .populate('author', 'authorName profileImage')
  .sort({ 'featured.featuredAt': -1 })
  .limit(limit);
};

ideaSchema.statics.getRecentlyAdded = function(limit = 10) {
  return this.find({
    isActive: true,
    isPublic: true,
    moderationStatus: 'approved'
  })
  .populate('domain', 'title slug imageUrl')
  .populate('author', 'authorName profileImage')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Pre-save middleware to update stats
ideaSchema.pre('save', function(next) {
  // Update stats based on actual array lengths
  this.stats.totalLikes = this.likes.length;
  this.stats.totalViews = this.views.length;
  this.stats.totalCollaborationInterests = this.collaborationInterests.length;
  
  next();
});

// Ensure virtual fields are included in JSON
ideaSchema.set('toJSON', { virtuals: true });
ideaSchema.set('toObject', { virtuals: true });

const Idea = mongoose.model("Idea", ideaSchema);

module.exports = Idea;