const express = require('express');
const { checkUserConversionLimit } = require('../middleware/rateLimiter');
const { uploadMiddleware, uploadMultipleMiddleware } = require('../middleware/upload');
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
  editPdf
} = require('../controllers/conversionController');

const router = express.Router();

// Apply rate limiting to all conversion routes
router.use(checkUserConversionLimit);

// PDF to Word
router.post('/pdf-to-word', uploadMiddleware, pdfToWord);

// PDF to Excel
router.post('/pdf-to-excel', uploadMiddleware, pdfToExcel);

// PDF to JPG
router.post('/pdf-to-jpg', uploadMiddleware, pdfToJpg);

// Word to PDF
router.post('/word-to-pdf', uploadMiddleware, wordToPdf);

// Excel to PDF
router.post('/excel-to-pdf', uploadMiddleware, excelToPdf);

// JPG to PDF
router.post('/jpg-to-pdf', uploadMiddleware, jpgToPdf);

// Compress PDF
router.post('/compress-pdf', uploadMiddleware, compressPdf);

// Merge PDFs (multiple files)
router.post('/merge-pdf', uploadMultipleMiddleware, mergePdf);

// Split PDF
router.post('/split-pdf', uploadMiddleware, splitPdf);

// Edit PDF
router.post('/edit-pdf', uploadMiddleware, editPdf);

module.exports = router;
