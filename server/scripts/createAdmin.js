// scripts/createAdmin.js
// Run once: node scripts/createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User.model');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@nexora.app' });
    if (existing) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      fullName:     'Nexora Admin',
      email:        'admin@nexora.app',
      passwordHash: 'Admin@1234',   // Will be hashed automatically
      isAdmin:      true,
      isActive:     true,
    });

    console.log('─────────────────────────────────');
    console.log('✅ Admin created successfully!');
    console.log('Email:    admin@nexora.app');
    console.log('Password: Admin@1234');
    console.log('─────────────────────────────────');
    console.log('⚠️  Change password after first login!');

    process.exit(0);

  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();