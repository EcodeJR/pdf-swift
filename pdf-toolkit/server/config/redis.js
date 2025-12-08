const Redis = require('ioredis');

// Check if Redis should be enabled (for development, make it optional)
const redisEnabled = process.env.REDIS_ENABLED !== 'false';

// Redis client configuration for Redis Labs cloud
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379, // Parse port as integer
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately
  retryStrategy: (times) => {
    // Allow more retries for cloud Redis
    if (!redisEnabled || times > 10) {
      console.log('⚠️  Redis disabled or unavailable after 10 retries - running without Redis');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    console.log(`🔄 Redis retry attempt ${times}, waiting ${delay}ms...`);
    return delay;
  },
  // TLS configuration for Redis Cloud
  tls: process.env.REDIS_TLS === 'true' ? {
    // Use TLS 1.2 or higher
    minVersion: 'TLSv1.2',
    // Redis Labs cloud certificates
    rejectUnauthorized: false,
    // Add servername for SNI
    servername: process.env.REDIS_HOST
  } : undefined,
  // Connection timeout
  connectTimeout: 10000,
  // Keep connection alive
  keepAlive: 30000,
};

// Log configuration (without password)
console.log('📋 Redis Configuration:', {
  host: redisConfig.host,
  port: redisConfig.port,
  username: redisConfig.username,
  tls: !!redisConfig.tls,
  enabled: redisEnabled
});

// Create Redis client
const redisClient = new Redis(redisConfig);

// Track connection state
let isConnected = false;

// Handle connection events
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
  isConnected = true;
});

redisClient.on('error', (error) => {
  console.error('⚠️  Redis connection error:', error.message);
  console.error('Error details:', {
    code: error.code,
    syscall: error.syscall,
    address: error.address,
    port: error.port
  });
  console.log('ℹ️  Application will continue without Redis (rate limiting will use database)');
  isConnected = false;
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
  isConnected = true;
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Reconnecting to Redis...');
});

redisClient.on('close', () => {
  console.log('⚠️  Redis connection closed');
  isConnected = false;
});

redisClient.on('end', () => {
  console.log('⚠️  Redis connection ended');
  isConnected = false;
});

// Try to connect if enabled
if (redisEnabled) {
  console.log('🔌 Attempting to connect to Redis...');
  redisClient.connect().then(() => {
    console.log('✅ Redis connection initiated successfully');
  }).catch(err => {
    console.error('❌ Could not connect to Redis:', err.message);
    console.error('Full error:', err);
    console.log('ℹ️  Continuing without Redis - rate limiting will use database');
  });
} else {
  console.log('ℹ️  Redis disabled - using database for rate limiting');
}

// Export client with connection status checker
module.exports = redisClient;
module.exports.isConnected = () => isConnected;


