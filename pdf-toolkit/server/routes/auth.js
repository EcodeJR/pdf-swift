const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  sendWelcomeEmail,
  sendSecurityAlert,
  sendPasswordReset,
  sendPasswordChanged
} = require('../utils/email');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name || null,
      email,
      password: hashedPassword
    });

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email
    await sendWelcomeEmail(email);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        conversionsThisHour: user.conversionsThisHour
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get IP and device info
    const ip = req.ip || req.connection.remoteAddress;
    const device = req.headers['user-agent'] || 'Unknown device';

    // Check for new device/IP
    const isNewDevice = user.lastLoginIP && user.lastLoginIP !== ip;
    if (isNewDevice) {
      await sendSecurityAlert(email, ip, device);
    }

    // Update last login info
    user.lastLoginDate = new Date();
    user.lastLoginIP = ip;
    user.lastLoginDevice = device;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        conversionsThisHour: user.conversionsThisHour
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        conversionsThisHour: user.conversionsThisHour,
        filesStored: user.filesStored.length,
        accountCreatedAt: user.accountCreatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account with that email found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordReset(email, resetToken);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    // Send confirmation email
    await sendPasswordChanged(user.email);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/stats
// @desc    Get user statistics for dashboard
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check and reset hourly counter if needed
    const currentTime = new Date();
    const hoursSinceReset = (currentTime - user.hourResetTime) / (1000 * 60 * 60);

    // Reset counter if more than 1 hour has passed
    if (hoursSinceReset >= 1 || !user.hourResetTime) {
      console.log(`🔄 Resetting hourly counter for user ${user._id} (${hoursSinceReset.toFixed(2)} hours since last reset)`);
      user.conversionsThisHour = 0;
      user.hourResetTime = currentTime;
      await user.save();
    }

    // Check if month needs to be reset
    const now = new Date();
    const monthResetTime = new Date(user.monthResetTime);
    const monthsSinceReset = (now.getFullYear() - monthResetTime.getFullYear()) * 12 + (now.getMonth() - monthResetTime.getMonth());

    if (monthsSinceReset >= 1) {
      // Reset monthly counter
      user.conversionsThisMonth = 0;
      user.monthResetTime = now;
      await user.save();
    }

    res.json({
      totalConversions: user.totalConversions || 0,
      conversionsThisMonth: user.conversionsThisMonth || 0,
      conversionsThisHour: user.conversionsThisHour || 0,
      filesStored: user.filesStored?.length || 0,
      isPremium: user.isPremium,
      accountType: user.isPremium ? 'Premium' : 'Free'
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
