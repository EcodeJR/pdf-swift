const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { localUpload } = require('../middleware/upload');
const { enhancedRateLimiter } = require('../middleware/rateLimiter');
const jobController = require('../controllers/jobController');

// Apply rate limiting to all routes
router.use(enhancedRateLimiter());

// Submit conversion job
router.post(
    '/submit',
    localUpload.single('file'),
    jobController.submitConversionJob
);

// Submit OCR job
router.post(
    '/ocr',
    protect,
    localUpload.single('file'),
    jobController.submitOcrJob
);

// Get job status
router.get(
    '/:jobId/status',
    jobController.getJobStatus
);

// Get job result (download)
router.get(
    '/:jobId/result',
    jobController.getJobResult
);

// Cancel job
router.delete(
    '/:jobId',
    jobController.cancelJob
);

// Get user's job history
router.get(
    '/user/history',
    protect,
    jobController.getUserJobs
);

module.exports = router;
