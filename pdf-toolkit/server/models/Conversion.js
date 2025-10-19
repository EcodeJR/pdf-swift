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
    required: true
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
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversion', conversionSchema);
