const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Rate limiter for guest users (by IP)
const guestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 conversions per hour
  message: {
    error: 'Too many conversions. Please upgrade to Premium for unlimited conversions.',
    upgradeRequired: true
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for logged-in free users
const checkUserConversionLimit = async (req, res, next) => {
  try {
    // If no user (guest), use IP-based rate limiting
    if (!req.user) {
      return guestRateLimit(req, res, next);
    }

    // Premium users have no limits
    if (req.user.isPremium) {
      return next();
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Reset counter if it's been more than an hour
    if (req.user.hourResetTime < hourAgo) {
      req.user.conversionsThisHour = 0;
      req.user.hourResetTime = now;
      await req.user.save();
    }

    // Check if user has exceeded limit
    if (req.user.conversionsThisHour >= parseInt(process.env.FREE_CONVERSIONS_PER_HOUR)) {
      return res.status(429).json({
        error: 'Conversion limit reached. You have used all 3 free conversions this hour.',
        upgradeRequired: true,
        conversionsRemaining: 0,
        resetTime: new Date(req.user.hourResetTime.getTime() + 60 * 60 * 1000)
      });
    }

    // Increment counter
    req.user.conversionsThisHour += 1;
    await req.user.save();

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { guestRateLimit, checkUserConversionLimit };
