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
    maxFree = 3, // 3 conversions for free users
    maxGuest = 3, // 3 conversions for guests
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
      return next();
    }

    // Check for authenticated free users
    if (req.user) {
      const user = req.user;
      const currentTime = new Date();
      const hoursSinceReset = (currentTime - user.hourResetTime) / (1000 * 60 * 60);

      // Reset counter if more than 1 hour has passed
      if (hoursSinceReset >= 1 || !user.hourResetTime) {
        user.conversionsThisHour = 0;
        user.hourResetTime = currentTime;
        await user.save();
      }

      // Check if user has exceeded limit
      const limit = parseInt(process.env.FREE_CONVERSIONS_PER_HOUR || 3);
      if (user.conversionsThisHour >= limit) {
        return res.status(429).json({
          message: 'You have reached your conversion limit for this hour. Upgrade to Premium for unlimited conversions!',
          limitExceeded: true,
          upgradeRequired: true,
          remaining: 0,
        });
      }

      // Increment counter
      user.conversionsThisHour += 1;
      await user.save();

      // Add remaining count to response
      res.locals.conversionsRemaining = limit - user.conversionsThisHour;
    }

    next();
  } catch (error) {
    console.error('User conversion limit error:', error);
    next();
  }
};

module.exports = {
  enhancedRateLimiter,
  checkUserConversionLimit,
  checkRateLimit,
  getRateLimitKey,
};

