// Quick script to reset your conversionsThisHour counter
// Run this with: node resetCounter.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

async function resetCounter() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find your user and reset the counter
        const result = await User.updateMany(
            {}, // Update all users
            {
                $set: {
                    conversionsThisHour: 0,
                    hourResetTime: new Date()
                }
            }
        );

        console.log(`✅ Reset counter for ${result.modifiedCount} user(s)`);
        console.log('Your conversionsThisHour is now 0.');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetCounter();
