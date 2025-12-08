require('dotenv').config();
const redisClient = require('./config/redis');

console.log('\n🧪 Testing Redis Connection...\n');

// Wait a bit for connection to establish
setTimeout(async () => {
    try {
        console.log('Current Redis status:', redisClient.status);

        if (redisClient.status === 'ready') {
            console.log('\n✅ Redis is connected and ready!');

            // Test basic operations
            console.log('\n📝 Testing SET operation...');
            await redisClient.set('test:key', 'Hello Redis!');
            console.log('✅ SET successful');

            console.log('\n📖 Testing GET operation...');
            const value = await redisClient.get('test:key');
            console.log('✅ GET successful, value:', value);

            console.log('\n🗑️  Testing DEL operation...');
            await redisClient.del('test:key');
            console.log('✅ DEL successful');

            console.log('\n🎉 All Redis operations successful!');

            // Get server info
            console.log('\n📊 Redis Server Info:');
            const info = await redisClient.info('server');
            const lines = info.split('\r\n').filter(line =>
                line.includes('redis_version') ||
                line.includes('os') ||
                line.includes('uptime_in_days')
            );
            lines.forEach(line => console.log('  ', line));

        } else {
            console.log('\n❌ Redis is not ready. Status:', redisClient.status);
            console.log('Check the error messages above for details.');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Redis test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}, 5000); // Wait 5 seconds for connection

console.log('⏳ Waiting for Redis connection (5 seconds)...\n');
