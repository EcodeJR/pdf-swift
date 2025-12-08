// Quick test to check Redis connection status
const redisClient = require('./config/redis');

console.log('Testing Redis connection...');
console.log('redisClient.isConnected:', typeof redisClient.isConnected);
console.log('redisClient.isConnected():', redisClient.isConnected ? redisClient.isConnected() : 'N/A');
console.log('redisClient.status:', redisClient.status);

setTimeout(() => {
    console.log('\nAfter 2 seconds:');
    console.log('redisClient.isConnected():', redisClient.isConnected ? redisClient.isConnected() : 'N/A');
    console.log('redisClient.status:', redisClient.status);
    process.exit(0);
}, 2000);
