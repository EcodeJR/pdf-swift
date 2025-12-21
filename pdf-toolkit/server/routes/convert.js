const express = require('express');
const router = express.Router();
const { localUpload } = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');
const { enhancedRateLimiter, checkUserConversionLimit } = require('../middleware/rateLimiter');
const redisClient = require('../config/redis');
const {
  pdfToWord,
  pdfToExcel,
  pdfToJpg,
  wordToPdf,
  excelToPdf,
  jpgToPdf,
  compressPdf,
  mergePdf,
  splitPdf,
  editPdf,
  protectPdf,
  watermarkPdf,
  unlockPdf,
  downloadFile,
  downloadCloudFile
} = require('../controllers/conversionController');

// Apply optional auth to all conversion routes
router.use(optionalAuth);

// Smart rate limiter: Use Redis if available, fallback to database
router.use((req, res, next) => {
  // Check Redis connection status on EVERY request (not just at startup)
  const isRedisReady = redisClient.status === 'ready' && redisClient.isConnected && redisClient.isConnected();

  if (isRedisReady) {
    // Use fast Redis-based rate limiting
    console.log('📊 Using Redis for rate limiting');
    enhancedRateLimiter()(req, res, next);
  } else {
    // Fallback to database-based rate limiting
    console.log('📊 Using database for rate limiting (Redis status:', redisClient.status, ')');
    checkUserConversionLimit(req, res, next);
  }
});


// Conversion routes
router.post('/pdf-to-word', localUpload.single('file'), pdfToWord);
router.post('/pdf-to-excel', localUpload.single('file'), pdfToExcel);
router.post('/pdf-to-jpg', localUpload.single('file'), pdfToJpg);
router.post('/word-to-pdf', localUpload.single('file'), wordToPdf);
router.post('/excel-to-pdf', localUpload.single('file'), excelToPdf);
router.post('/jpg-to-pdf', localUpload.array('files', 10), jpgToPdf);
router.post('/compress-pdf', localUpload.single('file'), compressPdf);
router.post('/merge-pdf', localUpload.array('files', 10), mergePdf);
router.post('/split-pdf', localUpload.single('file'), splitPdf);
router.post('/edit-pdf', localUpload.single('file'), editPdf);
router.post('/protect-pdf', localUpload.single('file'), protectPdf);
router.post('/watermark-pdf', localUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'watermarkImage', maxCount: 1 }
]), watermarkPdf);
router.post('/unlock-pdf', localUpload.single('file'), unlockPdf);

// Download routes
router.get('/download/:filename', downloadFile);
router.get('/download/cloud/:fileId', downloadCloudFile);

module.exports = router;
