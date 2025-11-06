const fs = require('fs').promises;
const path = require('path');
const { uploadToGridFS } = require('./gridfsHelper');

/**
 * Handle file storage based on storage type
 * @param {string} filePath - Local file path
 * @param {string} filename - Filename
 * @param {string} storageType - 'temporary' or 'cloud'
 * @param {Object} metadata - Additional metadata for cloud storage
 * @returns {Promise<Object>} Storage result with download info
 */
const handleFileStorage = async (filePath, filename, storageType, metadata = {}) => {
  try {
    if (storageType === 'cloud') {
      // Upload to GridFS
      const result = await uploadToGridFS(filePath, filename, {
        ...metadata,
        storageType: 'cloud'
      });

      // Delete local file after successful upload
      try {
        await fs.unlink(filePath);
        console.log(`Local file deleted after GridFS upload: ${filePath}`);
      } catch (unlinkError) {
        console.error('Error deleting local file after GridFS upload:', unlinkError);
      }

      return {
        storageType: 'cloud',
        fileId: result.fileId.toString(),
        filename: result.filename,
        downloadUrl: `/api/convert/download/cloud/${result.fileId}`,
        message: 'File stored in cloud storage'
      };
    } else {
      // Keep in local temporary storage
      return {
        storageType: 'temporary',
        filename: filename,
        downloadUrl: `/api/convert/download/${filename}`,
        message: 'File stored temporarily (expires in 1 hour)'
      };
    }
  } catch (error) {
    console.error('File storage error:', error);
    throw error;
  }
};

/**
 * Clean up uploaded file
 * @param {string} filePath - Path to file to delete
 */
const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`Cleaned up file: ${filePath}`);
  } catch (error) {
    // File might already be deleted, log but don't throw
    console.warn(`Could not cleanup file ${filePath}:`, error.message);
  }
};

/**
 * Get file size
 * @param {string} filePath - Path to file
 * @returns {Promise<number>} File size in bytes
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

/**
 * Validate storage type and user permissions
 * @param {string} storageType - Requested storage type
 * @param {Object} user - User object (can be null)
 * @returns {Object} Validation result
 */
const validateStorageRequest = (storageType, user) => {
  if (storageType === 'cloud') {
    if (!user) {
      return {
        valid: false,
        error: 'Cloud storage requires authentication. Please login or register.'
      };
    }
    // Cloud storage available for all authenticated users
    return { valid: true };
  }
  
  // Temporary storage available for everyone
  return { valid: true };
};

/**
 * Get storage metadata for tracking
 * @param {Object} user - User object
 * @param {string} storageType - Storage type
 * @returns {Object} Metadata object
 */
const getStorageMetadata = (user, storageType) => {
  const metadata = {
    storageType,
    uploadDate: new Date()
  };

  if (user) {
    metadata.userId = user._id;
    metadata.userEmail = user.email;
    metadata.isPremium = user.isPremium || false;
  }

  if (storageType === 'cloud') {
    // Set expiration for free users (30 days), null for premium (unlimited)
    metadata.expiresAt = user && user.isPremium 
      ? null 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    // Temporary files expire in 1 hour
    metadata.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  }

  return metadata;
};

module.exports = {
  handleFileStorage,
  cleanupFile,
  getFileSize,
  validateStorageRequest,
  getStorageMetadata
};
