const Redis = require('ioredis');

// Redis client configuration for Redis Labs cloud
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || '***********************',
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // TLS configuration for Redis Labs
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Handle connection events
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis Labs');
});

redisClient.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Reconnecting to Redis...');
});

module.exports = redisClient;
