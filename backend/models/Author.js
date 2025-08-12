const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema({
  authorName: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    minlength: [2, 'Author name must be at least 2 characters'],
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  authorEmail: {
    type: String,
    required: [true, 'Author email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  profileImage: {
    type: String,
    default: '/uploads/defaults/default-author.png'
  },
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot exceed 2000 characters'],
    trim: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  organization: {
    type: String,
    trim: true,
    maxlength: [200, 'Organization name cannot exceed 200 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  contactInfo: {
    email: String,
    phone: String,
    alternateEmail: String,
    website: String,
    linkedin: String,
    orcid: String,
    researchGate: String
  },
  socialMedia: [{
    platform: {
      type: String,
      enum: ['whatsapp', 'instagram', 'telegram', 'twitter', 'linkedin', 'facebook', 'youtube', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  }],
  researchAreas: [{
    type: String,
    trim: true
  }],
  expertise: [{
    skill: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    yearsOfExperience: Number
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number,
    field: String,
    gpa: Number,
    honors: String
  }],
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
  collaborationPreferences: {
    availability: {
      type: String,
      enum: ['available', 'limited', 'not_available'],
      default: 'available'
    },
    availableForCollaboration: {
      type: Boolean,
      default: true
    },
    preferredRoles: [{
      type: String,
      enum: ['mentor', 'collaborator', 'consultant', 'reviewer']
    }],
    preferredCollaborationType: [{
      type: String,
      enum: ['research', 'mentoring', 'consulting', 'speaking', 'reviewing']
    }],
    interests: [String],
    timeCommitment: String,
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
  privacy: {
    showEmail: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: false },
    showFullProfile: { type: Boolean, default: true },
    allowDirectContact: { type: Boolean, default: true }
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    verificationMethod: String,
    verificationDate: Date
  },
  stats: {
    totalIdeas: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalCollaborations: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 }
  },
  topics: [{
    type: String,
    trim: true
  }],
  ideas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea'
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
authorSchema.index({ authorEmail: 1 });
authorSchema.index({ authorName: 'text', bio: 'text' });
authorSchema.index({ researchAreas: 1 });
authorSchema.index({ 'verification.isVerified': 1 });
authorSchema.index({ isActive: 1 });
authorSchema.index({ topics: 1 });
authorSchema.index({ 'stats.totalIdeas': -1 });
authorSchema.index({ userId: 1 });

// Virtual for backward compatibility
authorSchema.virtual('isVerified').get(function() {
  return this.verification.isVerified;
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

// Methods
authorSchema.methods.getPublicProfile = function() {
  const profile = {
    _id: this._id,
    authorName: this.authorName,
    profileImage: this.profileImage,
    bio: this.bio,
    title: this.title,
    organization: this.organization,
    department: this.department,
    position: this.position,
    researchAreas: this.researchAreas,
    expertise: this.expertise,
    education: this.education,
    socialMedia: this.socialMedia,
    publications: this.publications,
    stats: this.stats,
    isVerified: this.verification.isVerified,
    joinedAt: this.joinedAt
  };

  // Add contact info based on privacy settings
  if (this.privacy.showEmail) {
    profile.authorEmail = this.authorEmail;
    profile.contactInfo = { ...profile.contactInfo, email: this.authorEmail };
  }
  
  if (this.privacy.showPhone) {
    profile.phone = this.phone;
    profile.contactInfo = { ...profile.contactInfo, phone: this.phone };
  }

  // Add social media if public
  if (this.privacy.showFullProfile) {
    profile.website = this.contactInfo?.website;
  }

  return profile;
};

authorSchema.methods.isAvailableForCollaboration = function() {
  return this.isActive && 
         (this.collaborationPreferences.availability === 'available' ||
          this.collaborationPreferences.availableForCollaboration);
};

// Static methods
authorSchema.statics.findByTopic = function(topic) {
  return this.find({
    $or: [
      { topics: { $regex: topic, $options: 'i' } },
      { researchAreas: { $regex: topic, $options: 'i' } }
    ],
    isActive: true
  });
};

authorSchema.statics.searchAuthors = function(query, filters = {}, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  const searchFilter = {
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

  return this.find(searchFilter)
    .select('authorName title organization profileImage bio researchAreas verification.isVerified stats phone socialMedia')
    .sort(options.sort || { score: { $meta: "textScore" } })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

authorSchema.statics.getTopAuthors = function(criteria = 'ideas', limit = 10) {
  const sortField = `stats.total${criteria.charAt(0).toUpperCase() + criteria.slice(1)}`;
  
  return this.find({ isActive: true })
    .select('authorName title organization profileImage researchAreas verification.isVerified stats bio')
    .sort({ [sortField]: -1 })
    .limit(limit);
};

// Pre-save middleware
authorSchema.pre('save', function(next) {
  this.lastProfileUpdate = new Date();
  
  // Update contact info
  if (this.authorEmail) {
    if (!this.contactInfo) this.contactInfo = {};
    this.contactInfo.email = this.authorEmail;
  }
  if (this.phone) {
    if (!this.contactInfo) this.contactInfo = {};
    this.contactInfo.phone = this.phone;
  }
  
  next();
});

const Author = mongoose.model("Author", authorSchema);

module.exports = Author;