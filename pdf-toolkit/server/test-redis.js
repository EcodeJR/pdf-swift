// Quick test to verify Redis Labs connection
require('dotenv').config();
const Redis = require('ioredis');

const redisClient = new Redis({
    host: 'redis-17401.c245.us-east-1-3.ec2.cloud.redislabs.com',
    port: 17401,
    username: 'default',
    password: 'lzGbYEWRtJobfBvJmKwFbHTBzCozFM6q',
});

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis Labs!');
});

redisClient.on('ready', async () => {
    console.log('✅ Redis ready!');

    // Test set and get
    try {
        await redisClient.set('test', 'Hello from PDF Swift!');
        const value = await redisClient.get('test');
        console.log('✅ Test Value:', value);

        console.log('\n🎉 Redis Labs connection successful!');
        console.log('You can now start the server.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
});

redisClient.on('error', (error) => {
    console.error('❌ Redis error:', error.message);
    process.exit(1);
});
