const rateLimit = require('express-rate-limit');

// Rate limiter for guest users (IP-based)
const guestRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: { 
    message: 'You have exceeded the 5 conversions per hour limit. Please create a free account for cloud storage or upgrade to Premium for unlimited conversions.',
    limitExceeded: true
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user !== undefined, // Skip if user is authenticated
});

// Middleware to check conversion limits for authenticated users
const checkUserConversionLimit = async (req, res, next) => {
  try {
    // Skip for premium users
    if (req.user && req.user.isPremium) {
      return next();
    }

    // Check for authenticated free users
    if (req.user) {
      const user = req.user;
      const currentTime = new Date();
      const hoursSinceReset = (currentTime - user.hourResetTime) / (1000 * 60 * 60);

      // Reset counter if more than 1 hour has passed
      if (hoursSinceReset >= 1) {
        user.conversionsThisHour = 0;
        user.hourResetTime = currentTime;
        await user.save();
      }

      // Check if user has exceeded limit
      if (user.conversionsThisHour >= parseInt(process.env.FREE_CONVERSIONS_PER_HOUR || 5)) {
        return res.status(429).json({
          message: 'You have reached your conversion limit for this hour. Upgrade to Premium for unlimited conversions!',
          limitExceeded: true,
          upgradeRequired: true
        });
      }

      // Increment counter
      user.conversionsThisHour += 1;
      await user.save();
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(error);
  }
};

module.exports = { guestRateLimiter, checkUserConversionLimit };
