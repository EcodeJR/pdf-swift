const crypto = require('crypto');
const redisClient = require('../config/redis');

// Generate device fingerprint from request headers
const generateFingerprint = (req) => {
    const components = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['accept-encoding'] || '',
        req.headers['accept'] || '',
        req.ip || req.connection.remoteAddress || '',
    ];

    // Create hash from combined components
    const fingerprintString = components.join('|');
    const fingerprint = crypto
        .createHash('sha256')
        .update(fingerprintString)
        .digest('hex');

    return fingerprint;
};

// Middleware to add fingerprint to request
const fingerprintMiddleware = async (req, res, next) => {
    try {
        const fingerprint = generateFingerprint(req);
        req.deviceFingerprint = fingerprint;

        // Store fingerprint data in Redis for tracking
        const key = `fingerprint:${fingerprint}`;
        const exists = await redisClient.exists(key);

        if (!exists) {
            // First time seeing this device
            const deviceData = {
                fingerprint,
                firstSeen: Date.now(),
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                requestCount: 0,
            };

            await redisClient.setex(key, 86400 * 30, JSON.stringify(deviceData)); // 30 days
        }

        // Increment request count
        const deviceDataStr = await redisClient.get(key);
        if (deviceDataStr) {
            const deviceData = JSON.parse(deviceDataStr);
            deviceData.requestCount = (deviceData.requestCount || 0) + 1;
            deviceData.lastSeen = Date.now();
            deviceData.lastIp = req.ip;

            await redisClient.setex(key, 86400 * 30, JSON.stringify(deviceData));
        }

        next();
    } catch (error) {
        console.error('Fingerprint middleware error:', error);
        // Don't block request if fingerprinting fails
        req.deviceFingerprint = 'unknown';
        next();
    }
};

// Check if device is suspicious
const checkSuspiciousDevice = async (fingerprint) => {
    try {
        const key = `fingerprint:${fingerprint}`;
        const deviceDataStr = await redisClient.get(key);

        if (!deviceDataStr) {
            return { suspicious: false };
        }

        const deviceData = JSON.parse(deviceDataStr);
        const hoursSinceFirstSeen = (Date.now() - deviceData.firstSeen) / (1000 * 60 * 60);

        // Suspicious if:
        // 1. Very high request count in short time
        // 2. Changing IPs frequently
        const requestsPerHour = deviceData.requestCount / Math.max(hoursSinceFirstSeen, 1);

        if (requestsPerHour > 50) {
            return {
                suspicious: true,
                reason: 'High request rate',
                requestsPerHour,
            };
        }

        return { suspicious: false };

    } catch (error) {
        console.error('Suspicious device check error:', error);
        return { suspicious: false };
    }
};

// Get device statistics
const getDeviceStats = async (fingerprint) => {
    try {
        const key = `fingerprint:${fingerprint}`;
        const deviceDataStr = await redisClient.get(key);

        if (!deviceDataStr) {
            return null;
        }

        return JSON.parse(deviceDataStr);

    } catch (error) {
        console.error('Get device stats error:', error);
        return null;
    }
};

// Block a device
const blockDevice = async (fingerprint, reason, duration = 86400) => {
    try {
        const key = `blocked:${fingerprint}`;
        const blockData = {
            fingerprint,
            reason,
            blockedAt: Date.now(),
            expiresAt: Date.now() + (duration * 1000),
        };

        await redisClient.setex(key, duration, JSON.stringify(blockData));

        return true;
    } catch (error) {
        console.error('Block device error:', error);
        return false;
    }
};

// Check if device is blocked
const isDeviceBlocked = async (fingerprint) => {
    try {
        const key = `blocked:${fingerprint}`;
        const blockDataStr = await redisClient.get(key);

        if (!blockDataStr) {
            return { blocked: false };
        }

        const blockData = JSON.parse(blockDataStr);

        return {
            blocked: true,
            reason: blockData.reason,
            expiresAt: blockData.expiresAt,
        };

    } catch (error) {
        console.error('Check device blocked error:', error);
        return { blocked: false };
    }
};

// Middleware to check if device is blocked
const blockCheckMiddleware = async (req, res, next) => {
    try {
        const fingerprint = req.deviceFingerprint;

        if (!fingerprint || fingerprint === 'unknown') {
            return next();
        }

        const blockStatus = await isDeviceBlocked(fingerprint);

        if (blockStatus.blocked) {
            const remainingTime = Math.ceil((blockStatus.expiresAt - Date.now()) / 1000 / 60);

            return res.status(403).json({
                message: 'Device blocked due to suspicious activity',
                reason: blockStatus.reason,
                unblockIn: `${remainingTime} minutes`,
            });
        }

        next();
    } catch (error) {
        console.error('Block check middleware error:', error);
        next();
    }
};

module.exports = {
    fingerprintMiddleware,
    generateFingerprint,
    checkSuspiciousDevice,
    getDeviceStats,
    blockDevice,
    isDeviceBlocked,
    blockCheckMiddleware,
};
