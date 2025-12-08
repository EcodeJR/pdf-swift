require('dotenv').config();
const redisClient = require('./config/redis');

console.log('\n🔍 Checking Redis Status\n');

setTimeout(() => {
    console.log('Redis Status:', redisClient.status);
    console.log('Redis Connected:', redisClient.status === 'ready');

    if (redisClient.status === 'ready') {
        console.log('\n✅ Redis is CONNECTED and ready');
        console.log('This means conversion routes are using Redis rate limiting');
        console.log('Redis tracks conversions separately from the database');
    } else {
        console.log('\n❌ Redis is NOT connected');
        console.log('This means conversion routes are using database rate limiting');
    }

    process.exit(0);
}, 2000);
