const fs = require('fs').promises;
const path = require('path');

// Track files currently being accessed (in-memory lock)
const activeFiles = new Set();

/**
 * Mark a file as active (being downloaded/accessed)
 * @param {string} filename - Name of the file
 */
const lockFile = (filename) => {
  activeFiles.add(filename);
  console.log(`File locked: ${filename}`);
};

/**
 * Mark a file as no longer active
 * @param {string} filename - Name of the file
 */
const unlockFile = (filename) => {
  activeFiles.delete(filename);
  console.log(`File unlocked: ${filename}`);
};

/**
 * Check if a file is currently being accessed
 * @param {string} filename - Name of the file
 * @returns {boolean}
 */
const isFileLocked = (filename) => {
  return activeFiles.has(filename);
};

/**
 * Safe file cleanup - only deletes files that are not locked
 * @param {string} uploadsPath - Path to uploads directory
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {Promise<{deleted: number, skipped: number}>}
 */
const cleanupOldFiles = async (uploadsPath, maxAgeMs = 60 * 60 * 1000) => {
  try {
    const files = await fs.readdir(uploadsPath);
    const now = Date.now();
    
    let deletedCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      // Skip if file is currently locked (being accessed)
      if (isFileLocked(file)) {
        skippedCount++;
        console.log(`Skipping locked file: ${file}`);
        continue;
      }
      
      try {
        const filePath = path.join(uploadsPath, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtimeMs;
        
        // Delete files older than maxAge
        if (fileAge > maxAgeMs) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`Deleted expired file: ${file} (age: ${Math.round(fileAge / 1000 / 60)} minutes)`);
        }
      } catch (error) {
        // File might have been deleted by another process, skip it
        console.error(`Error processing file ${file}:`, error.message);
        skippedCount++;
      }
    }
    
    return { deleted: deletedCount, skipped: skippedCount };
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
};

/**
 * Get list of all active (locked) files
 * @returns {Array<string>}
 */
const getActiveFiles = () => {
  return Array.from(activeFiles);
};

/**
 * Clear all file locks (use with caution, typically only on server restart)
 */
const clearAllLocks = () => {
  const count = activeFiles.size;
  activeFiles.clear();
  console.log(`Cleared ${count} file locks`);
  return count;
};

/**
 * Auto-unlock file after a timeout (safety mechanism)
 * @param {string} filename - Name of the file
 * @param {number} timeoutMs - Timeout in milliseconds (default 5 minutes)
 */
const lockFileWithTimeout = (filename, timeoutMs = 5 * 60 * 1000) => {
  lockFile(filename);
  
  // Auto-unlock after timeout to prevent permanent locks
  setTimeout(() => {
    if (isFileLocked(filename)) {
      console.warn(`Auto-unlocking file after timeout: ${filename}`);
      unlockFile(filename);
    }
  }, timeoutMs);
};

module.exports = {
  lockFile,
  unlockFile,
  isFileLocked,
  cleanupOldFiles,
  getActiveFiles,
  clearAllLocks,
  lockFileWithTimeout
};
