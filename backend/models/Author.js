const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  authorName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  authorEmail: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  profileImage: {
    type: String,
    default: "/uploads/defaults/default-author.png"
  },
  bio: { 
    type: String,
    maxlength: 1000
  },
  
  // Professional Information
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  organization: {
    type: String,
    trim: true,
    maxlength: 200
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Contact Information
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    alternateEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    },
    orcid: {
      type: String,
      trim: true
    },
    researchGate: {
      type: String,
      trim: true
    }
  },
  
  // Research Areas and Expertise
  researchAreas: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  expertise: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    yearsOfExperience: Number
  }],
  
  // Academic Information
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    field: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    year: Number,
    gpa: Number,
    honors: String
  }],
  
  // Publications and Research
  publications: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    journal: String,
    year: Number,
    doi: String,
    url: String,
    citationCount: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ['journal', 'conference', 'book', 'chapter', 'preprint', 'other'],
      default: 'journal'
    }
  }],
  
  // Social Media and Online Presence
  socialMedia: {
    twitter: String,
    github: String,
    stackoverflow: String,
    medium: String,
    blog: String
  },
  
  // Collaboration Preferences
  collaborationPreferences: {
    availableForCollaboration: {
      type: Boolean,
      default: true
    },
    preferredCollaborationType: [{
      type: String,
      enum: ['research', 'mentoring', 'consulting', 'speaking', 'reviewing']
    }],
    timeAvailability: {
      type: String,
      enum: ['full-time', 'part-time', 'weekends', 'flexible', 'limited'],
      default: 'flexible'
    },
    preferredCommunication: [{
      type: String,
      enum: ['email', 'phone', 'video-call', 'in-person', 'chat']
    }],
    workingTimezone: String,
    languages: [String]
  },
  
  // Privacy Settings
  privacy: {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showFullProfile: { type: Boolean, default: true },
    allowDirectContact: { type: Boolean, default: true }
  },
  
  // Association with Ideas/Projects
  ideas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea'
  }],
  topics: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  
  // Verification and Status
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'institution', 'orcid', 'manual'],
    default: 'email'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // User Association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  stats: {
    totalIdeas: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalCollaborations: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 }
  },
  
  // Metadata
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Update contact info email when authorEmail changes
authorSchema.pre('save', function(next) {
  if (this.isModified('authorEmail')) {
    this.contactInfo.email = this.authorEmail;
  }
  next();
});

// Virtual for full name with title
authorSchema.virtual('displayName').get(function() {
  return this.title ? `${this.title} ${this.authorName}` : this.authorName;
});

// Virtual for full contact info
authorSchema.virtual('fullContactInfo').get(function() {
  const contact = {};
  
  if (this.privacy.showEmail || !this.privacy.showFullProfile) {
    contact.email = this.contactInfo.email;
  }
  
  if (this.privacy.showPhone || !this.privacy.showFullProfile) {
    contact.phone = this.contactInfo.phone;
  }
  
  return contact;
});

// Instance method to check collaboration availability
authorSchema.methods.isAvailableForCollaboration = function() {
  return this.isActive && this.collaborationPreferences.availableForCollaboration;
};

// Instance method to get public profile
authorSchema.methods.getPublicProfile = function() {
  const profile = {
    _id: this._id,
    authorName: this.authorName,
    title: this.title,
    organization: this.organization,
    bio: this.bio,
    profileImage: this.profileImage,
    researchAreas: this.researchAreas,
    expertise: this.expertise,
    isVerified: this.isVerified,
    stats: this.stats,
    joinedAt: this.joinedAt
  };
  
  // Add contact info based on privacy settings
  if (this.privacy.showEmail) {
    profile.email = this.contactInfo.email;
  }
  
  if (this.privacy.showPhone) {
    profile.phone = this.contactInfo.phone;
  }
  
  // Add social media if public
  if (this.privacy.showFullProfile) {
    profile.socialMedia = this.socialMedia;
    profile.website = this.contactInfo.website;
  }
  
  return profile;
};

// Static method to find by topic
authorSchema.statics.findByTopic = function(topic) {
  return this.find({ 
    topics: { $regex: new RegExp(topic, 'i') },
    isActive: true 
  });
};

// Static method to search authors
authorSchema.statics.searchAuthors = function(query, filters = {}, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  const filter = {
    isActive: true,
    $or: [
      { authorName: searchRegex },
      { bio: searchRegex },
      { researchAreas: { $in: [searchRegex] } },
      { 'expertise.skill': searchRegex },
      { topics: { $in: [searchRegex] } }
    ],
    ...filters
  };

  return this.find(filter)
    .select('authorName title organization bio profileImage researchAreas isVerified stats')
    .sort(options.sort || { 'stats.totalIdeas': -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to get top authors
authorSchema.statics.getTopAuthors = function(criteria = 'ideas', limit = 10) {
  const sortField = criteria === 'ideas' ? 'stats.totalIdeas' : 
                   criteria === 'likes' ? 'stats.totalLikes' : 
                   'stats.totalViews';
  
  return this.find({ isActive: true })
    .select('authorName title organization profileImage researchAreas isVerified stats')
    .sort({ [sortField]: -1 })
    .limit(limit);
};

// Indexes for better performance
authorSchema.index({ authorEmail: 1 });
authorSchema.index({ authorName: 'text', bio: 'text', researchAreas: 'text' });
authorSchema.index({ topics: 1 });
authorSchema.index({ isActive: 1, isVerified: 1 });
authorSchema.index({ 'stats.totalIdeas': -1 });
authorSchema.index({ userId: 1 });

const Author = mongoose.model('Author', authorSchema);

module.exports = Author;