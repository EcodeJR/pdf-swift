const { createWorker } = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

// OCR worker pool
let ocrWorkers = [];
const MAX_WORKERS = 2;

// Initialize OCR workers
const initializeWorkers = async () => {
    console.log('Initializing OCR workers...');

    for (let i = 0; i < MAX_WORKERS; i++) {
        const worker = await createWorker('eng', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Worker ${i}: ${Math.round(m.progress * 100)}%`);
                }
            },
        });
        ocrWorkers.push(worker);
    }

    console.log(`✅ Initialized ${MAX_WORKERS} OCR workers`);
};

// Get available worker
const getWorker = () => {
    // Simple round-robin
    const worker = ocrWorkers.shift();
    ocrWorkers.push(worker);
    return worker;
};

// Extract text from a single image
const extractTextFromImage = async (imagePath, options = {}) => {
    try {
        const worker = getWorker();

        const { data } = await worker.recognize(imagePath, {
            ...options,
        });

        return {
            text: data.text,
            confidence: data.confidence,
            words: data.words,
            lines: data.lines,
        };
    } catch (error) {
        console.error('OCR extraction error:', error);
        throw new Error(`OCR failed: ${error.message}`);
    }
};

// Process scanned PDF and extract text from all pages
const extractTextFromPdf = async (pdfPath, options = {}) => {
    try {
        const pdfBuffer = await fs.readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        const results = [];

        for (let i = 0; i < pageCount; i++) {
            // Extract page as image
            const pagePdf = await PDFDocument.create();
            const [copiedPage] = await pagePdf.copyPages(pdfDoc, [i]);
            pagePdf.addPage(copiedPage);

            const pdfBytes = await pagePdf.save();

            // Convert to image using sharp (temporary implementation)
            // Note: This is a simplified version. For production, use pdf2pic
            const imagePath = path.join(__dirname, '../uploads', `ocr-page-${i}-${Date.now()}.png`);

            // Create a temporary image from the PDF page
            // This is a placeholder - actual implementation needs pdf-to-image conversion
            console.log(`Processing page ${i + 1}/${pageCount}`);

            try {
                // Placeholder: In real implementation, convert PDF page to image first
                // For now, we'll skip this and return a message
                results.push({
                    page: i + 1,
                    text: '[OCR: PDF page to image conversion required]',
                    confidence: 0,
                });
            } catch (pageError) {
                results.push({
                    page: i + 1,
                    text: '',
                    error: pageError.message,
                });
            }
        }

        return {
            pageCount,
            pages: results,
            fullText: results.map(r => r.text).join('\n\n'),
        };
    } catch (error) {
        console.error('PDF OCR error:', error);
        throw new Error(`PDF OCR failed: ${error.message}`);
    }
};

// Create searchable PDF from scanned PDF
const createSearchablePdf = async (pdfPath, outputPath, options = {}) => {
    try {
        // Extract text from all pages
        const ocrResults = await extractTextFromPdf(pdfPath, options);

        // Load original PDF
        const pdfBuffer = await fs.readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Add text layer to each page (simplified version)
        // In production, you'd overlay invisible text at correct positions
        const pages = pdfDoc.getPages();

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const ocrText = ocrResults.pages[i]?.text || '';

            // Add invisible text layer
            // Note: This is a simplified implementation
            // Real implementation would position text based on OCR coordinates
            if (ocrText) {
                page.drawText(ocrText, {
                    x: 0,
                    y: 0,
                    size: 0.1, // Nearly invisible
                    opacity: 0.01,
                });
            }
        }

        // Save searchable PDF
        const searchablePdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, searchablePdfBytes);

        return {
            success: true,
            outputPath,
            pageCount: pages.length,
        };
    } catch (error) {
        console.error('Searchable PDF creation error:', error);
        throw new Error(`Searchable PDF creation failed: ${error.message}`);
    }
};

// Preprocess image for better OCR accuracy
const preprocessImage = async (imagePath, outputPath) => {
    try {
        await sharp(imagePath)
            .grayscale()
            .normalize()
            .sharpen()
            .toFile(outputPath);

        return outputPath;
    } catch (error) {
        console.error('Image preprocessing error:', error);
        throw error;
    }
};

// Terminate all workers
const terminateWorkers = async () => {
    console.log('Terminating OCR workers...');

    for (const worker of ocrWorkers) {
        await worker.terminate();
    }

    ocrWorkers = [];
    console.log('✅ All OCR workers terminated');
};

module.exports = {
    initializeWorkers,
    extractTextFromImage,
    extractTextFromPdf,
    createSearchablePdf,
    preprocessImage,
    terminateWorkers,
};
