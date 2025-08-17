// controllers/authController.js - MINIMAL FIX (PRESERVES ALL FUNCTIONALITY)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Register User - UNCHANGED
exports.register = async (req, res) => {
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

    const { username, email, password, fullName, phone, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      fullName,
      phone,
      bio
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profileImage: user.profileImage,
          isAdmin: user.isAdmin
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login User - MINIMAL FIX with enhanced debugging
exports.login = async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { 
      email: req.body.email, 
      hasPassword: !!req.body.password,
      timestamp: new Date().toISOString()
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email or username with improved query
    const user = await User.findByEmailOrUsername(email.trim());
    
    console.log('🔍 User lookup result:', user ? {
      found: true,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordHashLength: user.password?.length
    } : { found: false });
    
    if (!user) {
      console.log('❌ No user found with email/username:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account is deactivated:', user.username);
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Password validation with enhanced debugging
    console.log('🔒 Starting password validation...');
    let isPasswordValid = false;
    
    try {
      // Use the user's comparePassword method (this should work)
      isPasswordValid = await user.comparePassword(password);
      console.log('✅ Password validation result:', isPasswordValid);
      
      // If user method fails, try direct bcrypt compare as fallback
      if (!isPasswordValid) {
        console.log('⚠️ User.comparePassword failed, trying direct bcrypt...');
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('🔧 Direct bcrypt result:', isPasswordValid);
      }
      
    } catch (passwordError) {
      console.error('❌ Password comparison error:', passwordError);
      return res.status(500).json({
        success: false,
        message: 'Error during password verification'
      });
    }
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.username);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('✅ Token generated for user:', user.username);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Response structure that matches frontend expectations
    const responseData = {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin
      }
    };

    console.log('🎉 Login successful:', { 
      username: user.username, 
      isAdmin: user.isAdmin,
      timestamp: new Date().toISOString()
    });

    // Return response in the format expected by frontend
    res.json({
      success: true,
      message: 'Login successful',
      token: responseData.token,  // Root level for frontend compatibility
      data: responseData,
      user: responseData.user     // Root level for frontend compatibility
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ALL OTHER FUNCTIONS REMAIN EXACTLY THE SAME TO PRESERVE FUNCTIONALITY

// Get Current User Profile - UNCHANGED
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('collaborationInterests', 'title description')
      .populate('following', 'username fullName profileImage')
      .populate('followers', 'username fullName profileImage');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update User Profile - UNCHANGED
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['fullName', 'bio', 'phone', 'preferences'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle profile image if uploaded
    if (req.file) {
      updates.profileImage = `/uploads/users/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change Password - UNCHANGED
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout - UNCHANGED
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify Token - UNCHANGED
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profileImage: user.profileImage,
          isAdmin: user.isAdmin
        }
      }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Follow/Unfollow User - UNCHANGED
exports.toggleFollow = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      data: {
        isFollowing: !isFollowing,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length
      }
    });

  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get User by ID - UNCHANGED
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('following', 'username fullName profileImage')
      .populate('followers', 'username fullName profileImage');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive information for public view
    const publicUser = {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      profileImage: user.profileImage,
      bio: user.bio,
      following: user.following,
      followers: user.followers,
      createdAt: user.createdAt
    };

    // Add email if user is viewing their own profile or if privacy settings allow
    if (req.userId === userId || user.preferences.privacy.showEmail) {
      publicUser.email = user.email;
    }

    res.json({
      success: true,
      data: { user: publicUser }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};