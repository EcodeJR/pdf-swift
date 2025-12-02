require('dotenv').config();
const { conversionQueue, ocrQueue } = require('./utils/jobQueue');
const { initializeWorkers: initOcrWorkers, extractTextFromImage, extractTextFromPdf } = require('./utils/ocrService');
const io = require('socket.io-client');

// Import conversion functions (we'll need to refactor the controller to export these)
const conversionController = require('./controllers/conversionController');

// Connect to Socket.io server for progress updates
const socket = io(process.env.SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket'],
});

socket.on('connect', () => {
    console.log('✅ Worker connected to Socket.io server');
});

socket.on('disconnect', () => {
    console.log('❌ Worker disconnected from Socket.io server');
});

// Helper to emit progress
const emitProgress = (jobId, progress, message) => {
    socket.emit('job:progress', {
        jobId,
        progress,
        message,
    });
};

// Helper to emit completion
const emitComplete = (jobId, result) => {
    socket.emit('job:complete', {
        jobId,
        result,
    });
};

// Helper to emit failure
const emitFailure = (jobId, error) => {
    socket.emit('job:failed', {
        jobId,
        error: error.message,
    });
};

// Process conversion jobs
conversionQueue.process(async (job) => {
    const { jobId, conversionType, filePath, userId, options } = job.data;

    console.log(`🔄 Processing conversion job ${jobId}: ${conversionType}`);
    emitProgress(jobId, 0, 'Starting conversion...');

    try {
        let result;

        // Update progress at various stages
        emitProgress(jobId, 10, 'Loading file...');

        switch (conversionType) {
            case 'pdf-to-word':
                emitProgress(jobId, 30, 'Extracting text from PDF...');
                // Call the actual conversion function
                result = await processConversion('pdfToWord', filePath, options);
                break;

            case 'pdf-to-excel':
                emitProgress(jobId, 30, 'Extracting tables from PDF...');
                result = await processConversion('pdfToExcel', filePath, options);
                break;

            case 'pdf-to-jpg':
                emitProgress(jobId, 30, 'Converting PDF pages to images...');
                result = await processConversion('pdfToJpg', filePath, options);
                break;

            case 'word-to-pdf':
                emitProgress(jobId, 30, 'Converting Word to PDF...');
                result = await processConversion('wordToPdf', filePath, options);
                break;

            case 'excel-to-pdf':
                emitProgress(jobId, 30, 'Converting Excel to PDF...');
                result = await processConversion('excelToPdf', filePath, options);
                break;

            case 'jpg-to-pdf':
                emitProgress(jobId, 30, 'Converting images to PDF...');
                result = await processConversion('jpgToPdf', filePath, options);
                break;

            case 'compress-pdf':
                emitProgress(jobId, 30, 'Compressing PDF...');
                result = await processConversion('compressPdf', filePath, options);
                break;

            case 'merge-pdf':
                emitProgress(jobId, 30, 'Merging PDFs...');
                result = await processConversion('mergePdf', filePath, options);
                break;

            case 'split-pdf':
                emitProgress(jobId, 30, 'Splitting PDF...');
                result = await processConversion('splitPdf', filePath, options);
                break;

            case 'edit-pdf':
                emitProgress(jobId, 30, 'Editing PDF...');
                result = await processConversion('editPdf', filePath, options);
                break;

            default:
                throw new Error(`Unknown conversion type: ${conversionType}`);
        }

        emitProgress(jobId, 90, 'Finalizing...');

        // Emit completion
        emitComplete(jobId, result);
        emitProgress(jobId, 100, 'Conversion complete!');

        console.log(`✅ Completed conversion job ${jobId}`);
        return result;

    } catch (error) {
        console.error(`❌ Conversion job ${jobId} failed:`, error);
        emitFailure(jobId, error);
        throw error;
    }
});

// Process OCR jobs
ocrQueue.process(async (job) => {
    const { jobId, ocrType, filePath, options } = job.data;

    console.log(`🔄 Processing OCR job ${jobId}: ${ocrType}`);
    emitProgress(jobId, 0, 'Starting OCR processing...');

    try {
        let result;

        emitProgress(jobId, 20, 'Initializing OCR engine...');

        switch (ocrType) {
            case 'extract-text-image':
                emitProgress(jobId, 40, 'Recognizing text...');
                result = await extractTextFromImage(filePath, options);
                break;

            case 'extract-text-pdf':
                emitProgress(jobId, 40, 'Processing PDF pages...');
                result = await extractTextFromPdf(filePath, options);
                break;

            default:
                throw new Error(`Unknown OCR type: ${ocrType}`);
        }

        emitProgress(jobId, 90, 'Finalizing...');
        emitComplete(jobId, result);
        emitProgress(jobId, 100, 'OCR complete!');

        console.log(`✅ Completed OCR job ${jobId}`);
        return result;

    } catch (error) {
        console.error(`❌ OCR job ${jobId} failed:`, error);
        emitFailure(jobId, error);
        throw error;
    }
});

// Placeholder for conversion processing
// In production, these would call the actual conversion functions
const processConversion = async (type, filePath, options) => {
    // Simulate conversion time for now
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                outputPath: filePath.replace('.pdf', '_converted.pdf'),
                message: `${type} conversion completed`,
            });
        }, 2000);
    });
};

// Initialize
const initialize = async () => {
    console.log('🚀 Starting worker process...');

    try {
        // Initialize OCR workers
        await initOcrWorkers();

        console.log('✅ Worker initialized and ready to process jobs');
        console.log('👂 Listening for jobs...');

    } catch (error) {
        console.error('❌ Worker initialization failed:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📦 Shutting down worker...');
    await conversionQueue.close();
    await ocrQueue.close();
    process.exit(0);
});

// Start the worker
initialize();
