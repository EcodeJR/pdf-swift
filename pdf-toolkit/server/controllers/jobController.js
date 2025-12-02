const { addConversionJob, addOcrJob, getJobStatus, conversionQueue, ocrQueue } = require('../utils/jobQueue');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Submit a new conversion job
exports.submitConversionJob = async (req, res) => {
    try {
        const { conversionType, storageType } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!conversionType) {
            return res.status(400).json({ message: 'Conversion type is required' });
        }

        // Generate unique job ID
        const jobId = uuidv4();

        // Determine priority based on user type
        const priority = req.user?.isPremium ? 'high' : 'normal';

        // Create job data
        const jobData = {
            jobId,
            conversionType,
            filePath: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            userId: req.user?._id,
            storageType: storageType || 'temporary',
            options: req.body.options || {},
        };

        // Add job to queue
        const job = await addConversionJob(jobData, priority);

        res.status(202).json({
            message: 'Job queued successfully',
            jobId: job.id,
            status: 'queued',
            estimatedTime: Math.ceil(file.size / 10000), // Rough estimate in seconds
        });

    } catch (error) {
        console.error('Job submission error:', error);
        res.status(500).json({
            message: 'Failed to queue job',
            error: error.message
        });
    }
};

// Submit a new OCR job
exports.submitOcrJob = async (req, res) => {
    try {
        const { ocrType } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check if user is premium or has OCR quota
        if (!req.user?.isPremium) {
            // Check OCR usage for free users
            const ocrUsed = req.user?.ocrUsed || 0;
            const ocrLimit = parseInt(process.env.FREE_OCR_PER_MONTH || '10');

            if (ocrUsed >= ocrLimit) {
                return res.status(429).json({
                    message: 'OCR limit reached. Upgrade to premium for unlimited OCR.',
                    limit: ocrLimit,
                    used: ocrUsed,
                });
            }
        }

        // Generate unique job ID
        const jobId = uuidv4();

        // Determine priority
        const priority = req.user?.isPremium ? 'high' : 'normal';

        // Create job data
        const jobData = {
            jobId,
            ocrType: ocrType || 'extract-text-image',
            filePath: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            userId: req.user?._id,
            options: req.body.options || {},
        };

        // Add job to queue
        const job = await addOcrJob(jobData, priority);

        res.status(202).json({
            message: 'OCR job queued successfully',
            jobId: job.id,
            status: 'queued',
        });

    } catch (error) {
        console.error('OCR job submission error:', error);
        res.status(500).json({
            message: 'Failed to queue OCR job',
            error: error.message
        });
    }
};

// Get job status
exports.getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { type } = req.query; // 'conversion' or 'ocr'

        const status = await getJobStatus(jobId, type || 'conversion');

        if (status.status === 'not_found') {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json(status);

    } catch (error) {
        console.error('Job status error:', error);
        res.status(500).json({
            message: 'Failed to get job status',
            error: error.message
        });
    }
};

// Get job result (download file)
exports.getJobResult = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { type } = req.query;

        const queue = type === 'ocr' ? ocrQueue : conversionQueue;
        const job = await queue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const state = await job.getState();

        if (state !== 'completed') {
            return res.status(400).json({
                message: 'Job not completed yet',
                status: state
            });
        }

        const result = job.returnvalue;

        if (!result || !result.outputPath) {
            return res.status(404).json({ message: 'Result file not found' });
        }

        // Send the file
        res.download(result.outputPath, path.basename(result.outputPath), (err) => {
            if (err) {
                console.error('File download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Failed to download file' });
                }
            }
        });

    } catch (error) {
        console.error('Job result error:', error);
        res.status(500).json({
            message: 'Failed to get job result',
            error: error.message
        });
    }
};

// Cancel a job
exports.cancelJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { type } = req.query;

        const queue = type === 'ocr' ? ocrQueue : conversionQueue;
        const job = await queue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const state = await job.getState();

        if (state === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel completed job' });
        }

        if (state === 'active') {
            return res.status(400).json({ message: 'Cannot cancel job in progress' });
        }

        await job.remove();

        res.json({ message: 'Job cancelled successfully', jobId });

    } catch (error) {
        console.error('Job cancellation error:', error);
        res.status(500).json({
            message: 'Failed to cancel job',
            error: error.message
        });
    }
};

// Get user's job history
exports.getUserJobs = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { limit = 10, status } = req.query;

        // Get jobs from both queues
        const conversionJobs = await conversionQueue.getJobs([status || 'completed', 'failed', 'active', 'waiting'], 0, parseInt(limit));
        const ocrJobs = await ocrQueue.getJobs([status || 'completed', 'failed', 'active', 'waiting'], 0, parseInt(limit));

        // Filter by user ID
        const userId = req.user._id.toString();
        const userConversionJobs = conversionJobs.filter(job => job.data.userId?.toString() === userId);
        const userOcrJobs = ocrJobs.filter(job => job.data.userId?.toString() === userId);

        // Format job data
        const formatJob = async (job, type) => {
            const state = await job.getState();
            return {
                jobId: job.id,
                type,
                conversionType: job.data.conversionType || job.data.ocrType,
                fileName: job.data.fileName,
                status: state,
                progress: job.progress(),
                createdAt: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                failedReason: job.failedReason,
            };
        };

        const formattedConversionJobs = await Promise.all(
            userConversionJobs.map(job => formatJob(job, 'conversion'))
        );
        const formattedOcrJobs = await Promise.all(
            userOcrJobs.map(job => formatJob(job, 'ocr'))
        );

        const allJobs = [...formattedConversionJobs, ...formattedOcrJobs]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, parseInt(limit));

        res.json({
            jobs: allJobs,
            total: allJobs.length,
        });

    } catch (error) {
        console.error('Get user jobs error:', error);
        res.status(500).json({
            message: 'Failed to get job history',
            error: error.message
        });
    }
};
