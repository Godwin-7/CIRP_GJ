// scripts/createAdmin.js - SIMPLE VERSION (PRESERVES ALL FUNCTIONALITY)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Admin user data
const adminData = {
  username: 'CIRP-admin',
  email: 'cirp-admin@gmail.com',
  password: 'cirp-admin@123',
  fullName: 'CIRP Administrator',
  isAdmin: true,
  isActive: true,
  bio: 'System Administrator for CIRP Platform',
  emailVerified: true,
  preferences: {
    notifications: {
      email: true,
      push: true
    },
    privacy: {
      showEmail: false,
      showPhone: false
    }
  }
};

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI , {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Delete existing admin completely to avoid conflicts
    await User.deleteMany({ 
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });
    console.log('🗑️ Removed any existing admin users');

    // Create new admin user - LET MONGOOSE HANDLE THE PASSWORD HASHING
    console.log('🔧 Creating new admin user...');
    
    const adminUser = new User({
      ...adminData
      // Don't hash password here - let User model's pre-save middleware handle it
    });
    
    await adminUser.save(); // This will trigger the pre-save middleware to hash the password

    console.log('✅ Admin user created successfully!');
    console.log('Admin Details:');
    console.log(`Username: ${adminUser.username}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log(`Admin Status: ${adminUser.isAdmin}`);
    console.log(`User ID: ${adminUser._id}`);

    // Test the password immediately after creation
    console.log('\n🧪 Testing password...');
    const savedUser = await User.findById(adminUser._id);
    const passwordTest = await savedUser.comparePassword(adminData.password);
    console.log('Password test result:', passwordTest ? '✅ SUCCESS' : '❌ FAILED');

    if (passwordTest) {
      console.log('\n🎉 Admin login should work now!');
      console.log('🔑 Use credentials: cirp-admin@gmail.com / cirp-admin@123');
    } else {
      console.log('\n❌ Password test failed - there may be a bcrypt configuration issue');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 11000) {
      console.error('Duplicate key error - admin user may already exist');
    }
    
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.message);
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Additional function to create multiple admins (preserved for compatibility)
const createMultipleAdmins = async (adminUsers) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for multiple admin creation');

    const results = [];
    
    for (const adminData of adminUsers) {
      try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ 
          $or: [
            { email: adminData.email },
            { username: adminData.username }
          ]
        });

        if (existingAdmin) {
          console.log(`Admin ${adminData.username} already exists`);
          if (!existingAdmin.isAdmin) {
            existingAdmin.isAdmin = true;
            await existingAdmin.save();
            results.push({ username: adminData.username, status: 'updated' });
          } else {
            results.push({ username: adminData.username, status: 'exists' });
          }
        } else {
          // Create new admin - let mongoose handle password hashing
          const adminUser = new User({
            ...adminData,
            isAdmin: true,
            isActive: true,
            emailVerified: true
          });
          
          await adminUser.save();
          results.push({ 
            username: adminData.username, 
            status: 'created',
            userId: adminUser._id 
          });
        }
      } catch (error) {
        console.error(`Error with admin ${adminData.username}:`, error.message);
        results.push({ 
          username: adminData.username, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    console.log('Admin creation results:', results);
    return results;

  } catch (error) {
    console.error('Error in batch admin creation:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Function to update existing admin password (preserved for troubleshooting)
const updateAdminPassword = async (email, newPassword) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for password update');

    const admin = await User.findOne({ email });
    
    if (!admin) {
      console.log('Admin user not found with email:', email);
      return;
    }

    // Set new password - let mongoose handle the hashing
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Export functions for reuse
module.exports = { createAdmin, createMultipleAdmins, updateAdminPassword };

// Run the script if called directly
if (require.main === module) {
  createAdmin();
}