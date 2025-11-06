const express = require('express');
const router = express.Router();
const { localUpload } = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');
const { guestRateLimiter, checkUserConversionLimit } = require('../middleware/rateLimiter');
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
  downloadFile,
  downloadCloudFile
} = require('../controllers/conversionController');

// Apply optional auth and rate limiting to all conversion routes
router.use(optionalAuth);
router.use(guestRateLimiter);
router.use(checkUserConversionLimit);

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

// Download routes
router.get('/download/:filename', downloadFile);
router.get('/download/cloud/:fileId', downloadCloudFile);

module.exports = router;
