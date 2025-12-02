const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { localUpload } = require('../middleware/upload');
const { enhancedRateLimiter } = require('../middleware/rateLimiter');
const { extractTextFromImage, extractTextFromPdf } = require('../utils/ocrService');
const fs = require('fs').promises;

// Apply rate limiting
router.use(enhancedRateLimiter());

// Extract text from image
router.post(
    '/extract-text',
    localUpload.single('file'),
    async (req, res) => {
        try {
            const file = req.file;

            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Check if user has OCR quota (if not premium)
            if (req.user && !req.user.isPremium) {
                const ocrUsed = req.user.ocrUsed || 0;
                const ocrLimit = parseInt(process.env.FREE_OCR_PER_MONTH || '10');

                if (ocrUsed >= ocrLimit) {
                    // Clean up file
                    await fs.unlink(file.path).catch(() => { });

                    return res.status(429).json({
                        message: 'OCR limit reached. Upgrade to premium for unlimited OCR.',
                        limit: ocrLimit,
                        used: ocrUsed,
                    });
                }

                // Increment OCR usage
                req.user.ocrUsed = (req.user.ocrUsed || 0) + 1;
                await req.user.save();
            }

            // Perform OCR
            const result = await extractTextFromImage(file.path, {
                lang: req.body.language || 'eng',
            });

            // Clean up file
            await fs.unlink(file.path).catch(() => { });

            res.json({
                success: true,
                text: result.text,
                confidence: result.confidence,
                wordCount: result.text.split(/\s+/).length,
            });

        } catch (error) {
            console.error('OCR extract text error:', error);

            // Clean up file if it exists
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => { });
            }

            res.status(500).json({
                message: 'OCR processing failed',
                error: error.message,
            });
        }
    }
);

// Extract text from scanned PDF
router.post(
    '/extract-pdf',
    localUpload.single('file'),
    async (req, res) => {
        try {
            const file = req.file;

            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Check if user has OCR quota (if not premium)
            if (req.user && !req.user.isPremium) {
                const ocrUsed = req.user.ocrUsed || 0;
                const ocrLimit = parseInt(process.env.FREE_OCR_PER_MONTH || '10');

                if (ocrUsed >= ocrLimit) {
                    await fs.unlink(file.path).catch(() => { });

                    return res.status(429).json({
                        message: 'OCR limit reached. Upgrade to premium for unlimited OCR.',
                        limit: ocrLimit,
                        used: ocrUsed,
                    });
                }

                // Increment OCR usage for each page (estimated)
                req.user.ocrUsed = (req.user.ocrUsed || 0) + 1;
                await req.user.save();
            }

            // Perform OCR on PDF
            const result = await extractTextFromPdf(file.path, {
                lang: req.body.language || 'eng',
            });

            // Clean up file
            await fs.unlink(file.path).catch(() => { });

            res.json({
                success: true,
                pageCount: result.pageCount,
                fullText: result.fullText,
                pages: result.pages,
            });

        } catch (error) {
            console.error('OCR PDF extraction error:', error);

            if (req.file) {
                await fs.unlink(req.file.path).catch(() => { });
            }

            res.status(500).json({
                message: 'PDF OCR processing failed',
                error: error.message,
            });
        }
    }
);

module.exports = router;
