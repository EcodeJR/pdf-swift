const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Conversion = require('../models/Conversion');

// @route   GET /api/user/stats
// @desc    Get user statistics
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

    // Get conversions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const conversionsThisMonth = await Conversion.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth }
    });

    // Calculate storage used (this would need GridFS implementation)
    const storageUsed = 0; // Placeholder

    res.json({
      conversionsThisHour: user.conversionsThisHour,
      conversionsLimit: user.isPremium ? 'Unlimited' : 5,
      conversionsThisMonth,
      filesStored: user.filesStored.length,
      storageUsed: storageUsed,
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
});

// @route   GET /api/user/conversion-history
// @desc    Get user's conversion history
// @access  Private
router.get('/conversion-history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversions = await Conversion.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Conversion.countDocuments({ userId: req.user._id });

    res.json({
      conversions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalConversions: total
    });
  } catch (error) {
    console.error('Get conversion history error:', error);
    res.status(500).json({ message: 'Error fetching conversion history' });
  }
});

// @route   GET /api/user/files
// @desc    Get user's files (both temporary and cloud storage)
// @access  Private
router.get('/files', protect, async (req, res) => {
  try {
    // Get all user files, sorted by most recent
    const allFiles = await Conversion.find({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    // Add expiry information for each file
    const now = Date.now();
    const filesWithExpiry = allFiles.map(file => {
      const fileObj = file.toObject();

      if (fileObj.expiresAt) {
        const expiresAtTime = new Date(fileObj.expiresAt).getTime();
        const timeRemaining = expiresAtTime - now;

        return {
          ...fileObj,
          timeRemaining: Math.max(0, timeRemaining), // milliseconds
          isExpired: timeRemaining <= 0,
          expiresIn: timeRemaining > 0 ? Math.ceil(timeRemaining / 60000) : 0 // minutes
        };
      }

      // Cloud files don't expire
      return {
        ...fileObj,
        timeRemaining: null,
        isExpired: false,
        expiresIn: null
      };
    });

    // Filter out expired files
    const activeFiles = filesWithExpiry.filter(f => !f.isExpired);

    res.json({ files: activeFiles });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Error fetching files' });
  }
});

// @route   DELETE /api/user/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/files/:id', protect, async (req, res) => {
  try {
    const conversion = await Conversion.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversion) {
      return res.status(404).json({ message: 'File not found' });
    }

    await Conversion.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile (name, etc.)
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// @route   PUT /api/user/password
// @desc    Change password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    const { sendPasswordChanged } = require('../utils/email');

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user._id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Send confirmation email
    await sendPasswordChanged(user.email);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// @route   PUT /api/user/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { emailNotifications, marketingEmails, darkMode } = req.body;

    const user = await User.findById(req.user._id);

    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (marketingEmails !== undefined) user.preferences.marketingEmails = marketingEmails;
    if (darkMode !== undefined) user.preferences.darkMode = darkMode;

    await user.save();

    res.json({
      message: 'Preferences updated',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    const bcrypt = require('bcryptjs');

    const user = await User.findById(req.user._id);

    // Verify password before deletion
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Delete all user files
    await Conversion.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    // TODO: Cancel Stripe subscription if active

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
});

module.exports = router;
