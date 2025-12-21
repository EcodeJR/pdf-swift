const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local temporary storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${originalName}-pdf-swift-${uniqueSuffix}${extension}`);
  }
});

// GridFS storage configuration for cloud storage
const createGridFsStorage = () => {
  return new GridFsStorage({
    url: process.env.MONGO_URI,

    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads',
            metadata: {
              userId: req.user ? req.user._id : null,
              originalName: file.originalname,
              uploadDate: new Date(),
              expiresAt: req.user && req.user.isPremium
                ? null
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for free users
            }
          };
          resolve(fileInfo);
        });
      });
    }
  });
};

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, XLSX, JPG, and PNG files are allowed.'), false);
  }
};

// File size limits
const getFileSize = (req) => {
  if (req.user && req.user.isPremium) {
    return parseInt(process.env.MAX_FILE_SIZE_PREMIUM || 52428800); // 50MB
  }
  return parseInt(process.env.MAX_FILE_SIZE_FREE || 10485760); // 10MB
};

// Local upload middleware
const localUpload = multer({
  storage: localStorage,
  limits: { fileSize: 52428800 }, // Max 50MB, will check user-specific limit in route
  fileFilter: fileFilter
});

// Cloud upload middleware (will be initialized in server.js after DB connection)
let cloudUpload;

const initCloudUpload = () => {
  const storage = createGridFsStorage();
  cloudUpload = multer({
    storage: storage,
    limits: { fileSize: 52428800 },
    fileFilter: fileFilter
  });
};

module.exports = { localUpload, initCloudUpload, getCloudUpload: () => cloudUpload, getFileSize };
