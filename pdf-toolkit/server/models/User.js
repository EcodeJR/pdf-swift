const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  subscriptionId: {
    type: String,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'none'],
    default: 'none'
  },
  conversionsThisHour: {
    type: Number,
    default: 0
  },
  hourResetTime: {
    type: Date,
    default: Date.now
  },
  filesStored: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files'
  }],
  accountCreatedAt: {
    type: Date,
    default: Date.now
  },
  lastLoginDate: {
    type: Date,
    default: null
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  lastLoginDevice: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
