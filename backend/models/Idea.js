  const mongoose = require('mongoose');

  const ideaSchema = new mongoose.Schema({
    title: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: { 
      type: String, 
      required: true,
      maxlength: 2000
    },
    detailedDescription: {
      type: String,
      maxlength: 10000
    },
    domain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Domain',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Project Details Section
    projectImage: {
      type: String,
      default: "/uploads/defaults/default-project.png"
    },
    additionalImages: [{
      url: String,
      caption: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    relatedLinks: [{
      title: String,
      url: String,
      description: String,
      type: { 
        type: String, 
        enum: ['website', 'github', 'paper', 'video', 'documentation', 'other'],
        default: 'other'
      }
    }],
    researchPapers: [{
      title: String,
      authors: [String],
      journal: String,
      year: Number,
      doi: String,
      url: String,
      pdfPath: String
    }],
    projectPdf: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    },
    
    // Collaboration and Interest
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: { type: Date, default: Date.now }
    }],
    collaborationInterests: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      skills: [String],
      interestedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
      }
    }],
    
    // Project Status and Progress
    status: {
      type: String,
      enum: ['idea', 'planning', 'in-progress', 'testing', 'completed', 'on-hold', 'abandoned'],
      default: 'idea'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true
    },
    estimatedDuration: {
      value: Number,
      unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], default: 'weeks' }
    },
    requiredSkills: [{
      skill: String,
      level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' }
    }],
    requiredResources: [{
      resource: String,
      quantity: String,
      cost: Number,
      currency: { type: String, default: 'USD' },
      optional: { type: Boolean, default: false }
    }],
    
    // Research and Development
    currentResearch: {
      overview: String,
      keyFindings: [String],
      challenges: [String],
      nextSteps: [String],
      lastUpdated: Date
    },
    futureEnhancements: [{
      title: String,
      description: String,
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      estimatedEffort: String
    }],
    scope: {
      shortTerm: [String],
      longTerm: [String],
      limitations: [String],
      assumptions: [String]
    },
    
    // Metadata and Analytics
    views: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewedAt: { type: Date, default: Date.now },
      duration: Number, // in seconds
      source: String // where they came from
    }],
    tags: [{
      type: String,
      trim: true,
      maxlength: 30
    }],
    category: {
      type: String,
      enum: ['Research', 'Development', 'Innovation', 'Improvement', 'Analysis', 'Other'],
      default: 'Research'
    },
    
    // Moderation and Visibility
    isPublic: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'under_review'],
      default: 'approved'
    },
    moderationNotes: String,
    
    // Statistics
    stats: {
      totalViews: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      totalCollaborators: { type: Number, default: 0 },
      shareCount: { type: Number, default: 0 }
    }
  }, { 
    timestamps: true 
  });

  // Create slug from title before saving
  ideaSchema.pre('save', function(next) {
    if (this.isModified('title')) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    next();
  });

  // Update stats before saving
  ideaSchema.pre('save', function(next) {
    this.stats.totalLikes = this.likes.length;
    this.stats.totalCollaborators = this.collaborationInterests.filter(ci => ci.status === 'accepted').length;
    next();
  });

  // Virtual for like count
  ideaSchema.virtual('likeCount').get(function() {
    return this.likes.length;
  });

  // Virtual for collaboration interest count
  ideaSchema.virtual('collaborationCount').get(function() {
    return this.collaborationInterests.length;
  });

  // Virtual for URL
  ideaSchema.virtual('url').get(function() {
    return `/api/ideas/${this._id}`;
  });

  // Instance method to check if user liked
  ideaSchema.methods.isLikedBy = function(userId) {
    return this.likes.some(like => like.user.toString() === userId.toString());
  };

  // Instance method to toggle like
  ideaSchema.methods.toggleLike = function(userId) {
    const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
    
    if (existingLike) {
      this.likes.pull(existingLike._id);
      return false; // unliked
    } else {
      this.likes.push({ user: userId });
      return true; // liked
    }
  };

  // Instance method to add view
  ideaSchema.methods.addView = function(userId, duration = 0, source = 'direct') {
    // Update unique views count
    const existingView = this.views.find(view => view.user && view.user.toString() === userId.toString());
    if (!existingView) {
      this.stats.uniqueViews += 1;
    }
    
    // Add view record
    this.views.push({
      user: userId,
      duration,
      source
    });
    
    this.stats.totalViews += 1;
  };

  // Static method to search ideas
  ideaSchema.statics.searchIdeas = function(query, filters = {}, options = {}) {
    const searchRegex = new RegExp(query, 'i');
    const filter = {
      isActive: true,
      isPublic: true,
      moderationStatus: 'approved',
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ],
      ...filters
    };

    return this.find(filter)
      .populate('domain', 'title slug')
      .populate('author', 'authorName authorEmail profileImage')
      .populate('createdBy', 'username fullName profileImage')
      .sort(options.sort || { createdAt: -1 })
      .limit(options.limit || 20)
      .skip(options.skip || 0);
  };

  // Static method to get trending ideas
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
              { $multiply: ['$stats.totalComments', 2] },
              '$stats.totalViews'
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
      }
    ]);
  };

  // Indexes for better performance
  ideaSchema.index({ title: 'text', description: 'text', tags: 'text' });
  ideaSchema.index({ domain: 1, difficulty: 1, isActive: 1 });
  ideaSchema.index({ createdBy: 1 });
  ideaSchema.index({ author: 1 });
  ideaSchema.index({ status: 1, isActive: 1 });
  ideaSchema.index({ createdAt: -1 });
  ideaSchema.index({ 'stats.totalLikes': -1 });
  ideaSchema.index({ 'stats.totalViews': -1 });
  ideaSchema.index({ slug: 1 });

  const Idea = mongoose.model("Idea", ideaSchema);

  module.exports = Idea;