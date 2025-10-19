const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, XLSX, JPG, and PNG files are allowed.'), false);
  }
};

// Local temporary storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instances
const localUpload = multer({
  storage: localStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_FREE) // 10MB for free users
  }
});

const localUploadPremium = multer({
  storage: localStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_PREMIUM) // 50MB for premium users
  }
});

// Middleware to choose upload limits based on user status
const uploadMiddleware = (req, res, next) => {
  const isPremium = req.user?.isPremium || false;
  const upload = isPremium ? localUploadPremium : localUpload;
  
  // Use single file upload for most conversions
  return upload.single('file')(req, res, next);
};

// Middleware for multiple file uploads (merge PDF)
const uploadMultipleMiddleware = (req, res, next) => {
  const isPremium = req.user?.isPremium || false;
  const upload = isPremium ? localUploadPremium : localUpload;
  
  // Allow up to 10 files for merge PDF
  return upload.array('files', 10)(req, res, next);
};

module.exports = {
  uploadMiddleware,
  uploadMultipleMiddleware,
  localUpload,
  localUploadPremium
};
