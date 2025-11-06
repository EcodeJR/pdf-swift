const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs');

let gfs;
let gridfsBucket;

/**
 * Initialize GridFS after MongoDB connection
 */
const initGridFS = () => {
  try {
    const conn = mongoose.connection;
    
    if (conn.readyState !== 1) {
      throw new Error('MongoDB not connected. Call this after connectDB()');
    }

    // Initialize GridFS Stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');

    // Initialize GridFSBucket (newer API)
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });

    console.log('GridFS initialized successfully');
    return { gfs, gridfsBucket };
  } catch (error) {
    console.error('GridFS initialization error:', error);
    throw error;
  }
};

/**
 * Upload a file to GridFS
 * @param {string} filePath - Local file path
 * @param {string} filename - Desired filename in GridFS
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} File info with GridFS ID
 */
const uploadToGridFS = (filePath, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    const readStream = fs.createReadStream(filePath);
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadDate: new Date()
      }
    });

    readStream.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      reject(error);
    });

    uploadStream.on('finish', () => {
      console.log(`File uploaded to GridFS: ${filename} (ID: ${uploadStream.id})`);
      resolve({
        fileId: uploadStream.id,
        filename: filename,
        metadata: metadata
      });
    });
  });
};

/**
 * Download a file from GridFS
 * @param {string} fileId - GridFS file ID
 * @param {string} destinationPath - Where to save the file
 * @returns {Promise<string>} Path to downloaded file
 */
const downloadFromGridFS = (fileId, destinationPath) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    try {
      const objectId = new mongoose.Types.ObjectId(fileId);
      const downloadStream = gridfsBucket.openDownloadStream(objectId);
      const writeStream = fs.createWriteStream(destinationPath);

      downloadStream.pipe(writeStream);

      downloadStream.on('error', (error) => {
        console.error('GridFS download error:', error);
        reject(error);
      });

      writeStream.on('error', (error) => {
        console.error('File write error:', error);
        reject(error);
      });

      writeStream.on('finish', () => {
        console.log(`File downloaded from GridFS to: ${destinationPath}`);
        resolve(destinationPath);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Stream a file from GridFS directly to HTTP response
 * @param {string} fileId - GridFS file ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const streamFromGridFS = (fileId, res) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    try {
      const objectId = new mongoose.Types.ObjectId(fileId);
      
      // Get file info first
      gridfsBucket.find({ _id: objectId }).toArray((err, files) => {
        if (err) {
          return reject(err);
        }

        if (!files || files.length === 0) {
          return reject(new Error('File not found in GridFS'));
        }

        const file = files[0];
        
        // Set response headers
        res.set('Content-Type', file.contentType || 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.set('Content-Length', file.length);

        // Stream the file
        const downloadStream = gridfsBucket.openDownloadStream(objectId);

        downloadStream.on('error', (error) => {
          console.error('GridFS stream error:', error);
          reject(error);
        });

        downloadStream.on('end', () => {
          resolve();
        });

        downloadStream.pipe(res);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Delete a file from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
const deleteFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    try {
      const objectId = new mongoose.Types.ObjectId(fileId);
      gridfsBucket.delete(objectId, (error) => {
        if (error) {
          console.error('GridFS delete error:', error);
          return reject(error);
        }
        console.log(`File deleted from GridFS: ${fileId}`);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get file info from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Object>} File metadata
 */
const getFileInfo = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    try {
      const objectId = new mongoose.Types.ObjectId(fileId);
      gridfsBucket.find({ _id: objectId }).toArray((err, files) => {
        if (err) {
          return reject(err);
        }

        if (!files || files.length === 0) {
          return reject(new Error('File not found'));
        }

        resolve(files[0]);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * List all files for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of file metadata
 */
const listUserFiles = (userId) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    gridfsBucket.find({ 'metadata.userId': userId }).toArray((err, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files || []);
    });
  });
};

/**
 * Cleanup expired files from GridFS
 * @returns {Promise<number>} Number of files deleted
 */
const cleanupExpiredFiles = async () => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }

  try {
    const now = new Date();
    const files = await gridfsBucket.find({
      'metadata.expiresAt': { $lt: now, $ne: null }
    }).toArray();

    let deletedCount = 0;
    for (const file of files) {
      try {
        await deleteFromGridFS(file._id.toString());
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete expired file ${file._id}:`, error);
      }
    }

    console.log(`Cleaned up ${deletedCount} expired files from GridFS`);
    return deletedCount;
  } catch (error) {
    console.error('GridFS cleanup error:', error);
    throw error;
  }
};

/**
 * Check if GridFS is initialized
 * @returns {boolean}
 */
const isInitialized = () => {
  return gfs !== undefined && gridfsBucket !== undefined;
};

module.exports = {
  initGridFS,
  uploadToGridFS,
  downloadFromGridFS,
  streamFromGridFS,
  deleteFromGridFS,
  getFileInfo,
  listUserFiles,
  cleanupExpiredFiles,
  isInitialized,
  getGFS: () => gfs,
  getGridFSBucket: () => gridfsBucket
};
