// routes/adminRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const router = express.Router();

// Admin Signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }
    
    // Create new admin
    const admin = new Admin({
      fullName,
      email,
      password,
      role: role || 'admin' // Default to 'admin' if not specified
    });
    
    await admin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id }, 
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id }, 
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    res.json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;