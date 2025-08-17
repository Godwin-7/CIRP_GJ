// scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Admin user data
const adminData = {
  username: 'CIRP-admin',
  email: 'cirp-admin@gmail.com',
  password: 'cirp-admin@123', // This will be hashed before saving
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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      
      // Update admin status if user exists but is not admin
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log('Updated existing user to admin status');
      }
      
      // Optional: Update password if needed (uncomment if you want to reset password)
      /*
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Password updated for existing admin');
      */
      
      process.exit(0);
    }

    // Hash the password before creating user
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    console.log('Password hashed successfully');

    // Create new admin user with hashed password
    const adminUser = new User({
      ...adminData,
      password: hashedPassword // Use hashed password
    });
    
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('Admin Details:');
    console.log(`Username: ${adminUser.username}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Admin Status: ${adminUser.isAdmin}`);
    console.log(`User ID: ${adminUser._id}`);
    console.log(`Password Hash: ${hashedPassword.substring(0, 20)}...`);

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

// Additional function to create multiple admins
const createMultipleAdmins = async (adminUsers) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for multiple admin creation');

    const results = [];
    const saltRounds = 12;
    
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
          // Hash password for new admin
          const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
          
          const adminUser = new User({
            ...adminData,
            password: hashedPassword, // Use hashed password
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

// Function to update existing admin password (for troubleshooting)
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

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`New Password Hash: ${hashedPassword.substring(0, 20)}...`);

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