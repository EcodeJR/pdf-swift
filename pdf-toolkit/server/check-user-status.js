require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('\n🔍 Checking User Conversion Counter Status\n');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({}).select('email conversionsThisHour hourResetTime isPremium');

        console.log(`Found ${users.length} user(s):\n`);

        users.forEach((user, index) => {
            const currentTime = new Date();
            const hoursSinceReset = user.hourResetTime
                ? (currentTime - user.hourResetTime) / (1000 * 60 * 60)
                : 'N/A';

            console.log(`User ${index + 1}:`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Premium: ${user.isPremium}`);
            console.log(`  Conversions This Hour: ${user.conversionsThisHour}`);
            console.log(`  Hour Reset Time: ${user.hourResetTime}`);
            console.log(`  Hours Since Reset: ${typeof hoursSinceReset === 'number' ? hoursSinceReset.toFixed(2) : hoursSinceReset}`);
            console.log(`  Should Reset: ${hoursSinceReset >= 1 || !user.hourResetTime ? 'YES ✅' : 'NO ❌'}`);
            console.log('');
        });

        mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
