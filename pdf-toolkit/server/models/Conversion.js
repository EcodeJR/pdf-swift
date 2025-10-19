const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  conversionType: {
    type: String,
    required: true,
    enum: [
      'pdf-to-word',
      'pdf-to-excel',
      'pdf-to-jpg',
      'word-to-pdf',
      'excel-to-pdf',
      'jpg-to-pdf',
      'compress-pdf',
      'merge-pdf',
      'split-pdf',
      'edit-pdf'
    ]
  },
  originalFileName: {
    type: String,
    required: true
  },
  outputFileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  conversionTime: {
    type: Number,
    default: 0
  },
  storageType: {
    type: String,
    enum: ['temporary', 'cloud'],
    required: true
  },
  gridFsFileId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for cleanup queries
conversionSchema.index({ expiresAt: 1 });
conversionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Conversion', conversionSchema);
