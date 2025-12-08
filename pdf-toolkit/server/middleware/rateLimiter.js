const rateLimit = require('express-rate-limit');
const redisClient = require('../config/redis');
const { checkSuspiciousDevice } = require('./deviceFingerprint');

// Helper to get rate limit key
const getRateLimitKey = (req) => {
  // Combine multiple factors for rate limiting
  if (req.user) {
    // Authenticated users: use user ID
    return `ratelimit:user:${req.user._id}`;
  } else {
    // Guest users: combine IP + device fingerprint
    const fingerprint = req.deviceFingerprint || 'unknown';
    const ip = req.ip || 'unknown';
    return `ratelimit:guest:${ip}:${fingerprint}`;
  }
};

// Check rate limit using Redis
const checkRateLimit = async (key, limit, windowMs) => {
  try {
    // Check if Redis is connected
    if (redisClient.status !== 'ready') {
      console.warn('⚠️  Redis not ready - allowing request');
      return { allowed: true, remaining: limit };
    }

    const current = await redisClient.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
      const ttl = await redisClient.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (ttl * 1000),
      };
    }

    // Increment counter
    await redisClient.incr(key);

    // Set expiration if this is the first request
    if (count === 0) {
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }

    return {
      allowed: true,
      remaining: limit - count - 1,
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request if Redis is down
    return { allowed: true, remaining: limit };
  }
};

// Enhanced rate limiter middleware
const enhancedRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 60 * 1000, // 1 hour
    maxFree = 5, // 5 conversions for free users (matches database limit)
    maxGuest = 5, // 5 conversions for guests (matches database limit)
    message = 'Rate limit exceeded',
  } = options;

  return async (req, res, next) => {
    try {
      // Skip for premium users
      if (req.user && req.user.isPremium) {
        return next();
      }

      // Get rate limit key
      const key = getRateLimitKey(req);
      const limit = req.user ? maxFree : maxGuest;

      // Check suspicious activity
      if (req.deviceFingerprint && req.deviceFingerprint !== 'unknown') {
        const suspiciousCheck = await checkSuspiciousDevice(req.deviceFingerprint);

        if (suspiciousCheck.suspicious) {
          // Reduce limit for suspicious devices
          console.warn(`Suspicious device detected: ${req.deviceFingerprint} - ${suspiciousCheck.reason}`);

          // Require CAPTCHA for suspicious devices (mark in request for next middleware)
          req.requireCaptcha = true;
        }
      }

      // Check rate limit
      const rateLimitStatus = await checkRateLimit(key, limit, windowMs);

      if (!rateLimitStatus.allowed) {
        const resetIn = Math.ceil((rateLimitStatus.resetTime - Date.now()) / 1000 / 60);

        return res.status(429).json({
          message: req.user
            ? 'You have reached your conversion limit. Upgrade to Premium for unlimited conversions!'
            : 'You have exceeded the conversion limit. Please create an account or upgrade to Premium.',
          limitExceeded: true,
          resetIn: `${resetIn} minutes`,
          upgradeRequired: true,
        });
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', rateLimitStatus.remaining);

      // Also update database counter for authenticated users (for dashboard display)
      if (req.user) {
        try {
          const User = require('../models/User');
          const user = await User.findById(req.user._id);
          if (user) {
            // Check and reset if needed (same logic as checkUserConversionLimit)
            const currentTime = new Date();
            const hoursSinceReset = (currentTime - user.hourResetTime) / (1000 * 60 * 60);

            if (hoursSinceReset >= 1 || !user.hourResetTime) {
              user.conversionsThisHour = 0;
              user.hourResetTime = currentTime;
            }

            // Increment counter
            user.conversionsThisHour += 1;
            await user.save();
            console.log(`✅ Database counter updated: ${user.conversionsThisHour}/5`);
          }
        } catch (dbError) {
          console.error('Error updating database counter:', dbError);
          // Don't block the request if database update fails
        }
      }

      next();

    } catch (error) {
      console.error('Enhanced rate limiter error:', error);
      // Don't block request on error
      next();
    }
  };
};

// Middleware to check conversion limits for authenticated users
const checkUserConversionLimit = async (req, res, next) => {
  try {
    // Skip for premium users
    if (req.user && req.user.isPremium) {
      console.log(`✅ Premium user ${req.user._id} - unlimited conversions`);
      return next();
    }

    // Check for authenticated free users
    if (req.user) {
      const user = req.user;
      const currentTime = new Date();
      const hoursSinceReset = (currentTime - user.hourResetTime) / (1000 * 60 * 60);

      // Reset counter if more than 1 hour has passed
      if (hoursSinceReset >= 1 || !user.hourResetTime) {
        console.log(`🔄 Resetting hourly counter for user ${user._id}`);
        user.conversionsThisHour = 0;
        user.hourResetTime = currentTime;
        await user.save();
      }

      // Check if user has exceeded limit BEFORE incrementing
      const limit = parseInt(process.env.FREE_CONVERSIONS_PER_HOUR || 5);
      console.log(`📊 User ${user._id}: ${user.conversionsThisHour}/${limit} conversions used this hour`);

      if (user.conversionsThisHour >= limit) {
        console.warn(`🚫 User ${user._id} exceeded limit (${user.conversionsThisHour}/${limit})`);
        return res.status(429).json({
          message: 'You have reached your conversion limit for this hour. Upgrade to Premium for unlimited conversions!',
          limitExceeded: true,
          upgradeRequired: true,
          remaining: 0,
        });
      }

      // Increment counter AFTER checking the limit
      user.conversionsThisHour += 1;
      await user.save();
      console.log(`✅ Conversion allowed. New count: ${user.conversionsThisHour}/${limit}`);

      // Add remaining count to response
      res.locals.conversionsRemaining = limit - user.conversionsThisHour;
    } else {
      // For guest users without Redis, we need to track via IP
      // This is a fallback - in production, Redis should be used for guests
      console.warn('⚠️  Guest user detected without Redis - allowing conversion (should use Redis in production)');
    }

    next();
  } catch (error) {
    console.error('❌ User conversion limit error:', error);
    // IMPORTANT: Still enforce limit on error to be safe
    if (req.user && !req.user.isPremium) {
      return res.status(500).json({
        message: 'Error checking conversion limits. Please try again.',
        error: error.message
      });
    }
    next();
  }
};

module.exports = {
  enhancedRateLimiter,
  checkUserConversionLimit,
  checkRateLimit,
  getRateLimitKey,
};

