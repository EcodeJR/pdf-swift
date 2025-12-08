require('dotenv').config();

console.log('\n🔍 Redis Connection Diagnostics\n');
console.log('Environment Variables:');
console.log('  REDIS_HOST:', process.env.REDIS_HOST);
console.log('  REDIS_PORT:', process.env.REDIS_PORT);
console.log('  REDIS_USERNAME:', process.env.REDIS_USERNAME);
console.log('  REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***SET***' : 'NOT SET');
console.log('  REDIS_TLS:', process.env.REDIS_TLS);
console.log('  REDIS_ENABLED:', process.env.REDIS_ENABLED);

console.log('\n📝 Testing different connection configurations...\n');

const Redis = require('ioredis');

// Test 1: Without TLS
console.log('Test 1: Connecting WITHOUT TLS...');
const client1 = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
    retryStrategy: () => null // Don't retry
});

client1.on('error', (err) => {
    console.log('  ❌ Without TLS failed:', err.message);
    client1.disconnect();
});

client1.on('ready', () => {
    console.log('  ✅ Without TLS SUCCESS!');
    client1.disconnect();
    process.exit(0);
});

client1.connect().catch(err => {
    console.log('  ❌ Connection failed:', err.message);

    // Test 2: With TLS but no servername
    console.log('\nTest 2: Connecting WITH TLS (no servername)...');
    const client2 = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        tls: {
            rejectUnauthorized: false
        },
        lazyConnect: true,
        retryStrategy: () => null
    });

    client2.on('error', (err) => {
        console.log('  ❌ With TLS (no servername) failed:', err.message);
        client2.disconnect();
    });

    client2.on('ready', () => {
        console.log('  ✅ With TLS (no servername) SUCCESS!');
        client2.disconnect();
        process.exit(0);
    });

    client2.connect().catch(err => {
        console.log('  ❌ Connection failed:', err.message);

        // Test 3: With full TLS config
        console.log('\nTest 3: Connecting WITH TLS (full config)...');
        const client3 = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
            tls: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: false,
                servername: process.env.REDIS_HOST
            },
            lazyConnect: true,
            retryStrategy: () => null
        });

        client3.on('error', (err) => {
            console.log('  ❌ With TLS (full config) failed:', err.message);
            client3.disconnect();
        });

        client3.on('ready', () => {
            console.log('  ✅ With TLS (full config) SUCCESS!');
            client3.disconnect();
            process.exit(0);
        });

        client3.connect().catch(err => {
            console.log('  ❌ Connection failed:', err.message);
            console.log('\n❌ All connection attempts failed.');
            console.log('\n💡 Suggestions:');
            console.log('  1. Verify your Redis Labs credentials in the .env file');
            console.log('  2. Check if the Redis instance is running');
            console.log('  3. Verify the port number (17401)');
            console.log('  4. Check Redis Labs dashboard for connection requirements');
            console.log('  5. Try using the Redis CLI or another tool to test the connection');
            process.exit(1);
        });
    });
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('\n⏱️  Connection timeout - no successful connection after 10 seconds');
    process.exit(1);
}, 10000);
