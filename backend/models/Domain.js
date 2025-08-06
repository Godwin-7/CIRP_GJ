const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  detailedDescription: {
    type: String,
    maxlength: 5000
  },
  topics: {
    easy: { 
      type: [String], 
      required: true,
      validate: [arrayLimit, '{PATH} exceeds the limit of 50']
    },
    medium: { 
      type: [String], 
      required: true,
      validate: [arrayLimit, '{PATH} exceeds the limit of 50']
    },
    hard: { 
      type: [String], 
      required: true,
      validate: [arrayLimit, '{PATH} exceeds the limit of 50']
    }
  },
  category: {
    type: String,
    enum: ['Technology', 'Biology', 'Physics', 'Chemistry', 'Mathematics', 'Engineering', 'Medicine', 'Environment', 'Other'],
    default: 'Other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  stats: {
    totalIdeas: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalCollaborations: { type: Number, default: 0 }
  },
  settings: {
    allowAnonymousIdeas: { type: Boolean, default: true },
    moderationRequired: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true }
  }
}, { 
  timestamps: true 
});

// Validator function for array length
function arrayLimit(val) {
  return val.length <= 50;
}

// Create slug from title before saving
domainSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Virtual for URL
domainSchema.virtual('url').get(function() {
  return `/api/domains/${this._id}`;
});

// Virtual for total topics count
domainSchema.virtual('totalTopics').get(function() {
  return this.topics.easy.length + this.topics.medium.length + this.topics.hard.length;
});

// Static method to find by slug
domainSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug });
};

// Static method to search domains
domainSchema.statics.searchDomains = function(query, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  const filter = {
    isActive: true,
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } }
    ]
  };

  return this.find(filter)
    .populate('createdBy', 'username fullName profileImage')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20);
};

// Index for better search performance
domainSchema.index({ title: 'text', description: 'text', tags: 'text' });
domainSchema.index({ category: 1, isActive: 1 });
domainSchema.index({ createdBy: 1 });
domainSchema.index({ slug: 1 });

const Domain = mongoose.model("Domain", domainSchema);

module.exports = Domain;