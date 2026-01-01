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

// Download routes - NO RATE LIMITING (downloads should always work after successful conversion)
router.get('/download/:filename', downloadFile);
router.get('/download/cloud/:fileId', downloadCloudFile);

// Smart rate limiter: Use Redis if available, fallback to database
// Only applies to POST (conversion) routes below this middleware
const conversionRateLimiter = (req, res, next) => {
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
};

// Conversion routes (rate-limited)
router.post('/pdf-to-word', conversionRateLimiter, localUpload.single('file'), pdfToWord);
router.post('/pdf-to-excel', conversionRateLimiter, localUpload.single('file'), pdfToExcel);
router.post('/pdf-to-jpg', conversionRateLimiter, localUpload.single('file'), pdfToJpg);
router.post('/word-to-pdf', conversionRateLimiter, localUpload.single('file'), wordToPdf);
router.post('/excel-to-pdf', conversionRateLimiter, localUpload.single('file'), excelToPdf);
router.post('/jpg-to-pdf', conversionRateLimiter, localUpload.array('files', 10), jpgToPdf);
router.post('/compress-pdf', conversionRateLimiter, localUpload.single('file'), compressPdf);
router.post('/merge-pdf', conversionRateLimiter, localUpload.array('files', 10), mergePdf);
router.post('/split-pdf', conversionRateLimiter, localUpload.single('file'), splitPdf);
router.post('/edit-pdf', conversionRateLimiter, localUpload.single('file'), editPdf);
router.post('/protect-pdf', conversionRateLimiter, localUpload.single('file'), protectPdf);
router.post('/watermark-pdf', conversionRateLimiter, localUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'watermarkImage', maxCount: 1 }
]), watermarkPdf);
router.post('/unlock-pdf', conversionRateLimiter, localUpload.single('file'), unlockPdf);

module.exports = router;
