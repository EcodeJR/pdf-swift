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
// @desc    Get user's cloud-stored files (placeholder for GridFS)
// @access  Private
router.get('/files', protect, async (req, res) => {
  try {
    // This would query GridFS for user's files
    // For now, return conversions with cloud storage
    const cloudFiles = await Conversion.find({ 
      userId: req.user._id,
      storageType: 'cloud'
    }).sort({ createdAt: -1 });

    res.json({ files: cloudFiles });
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

module.exports = router;
