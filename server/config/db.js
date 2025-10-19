const mongoose = require('mongoose');

async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = { connectDB };
