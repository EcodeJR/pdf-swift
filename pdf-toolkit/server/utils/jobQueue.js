const Queue = require('bull');
const redisClient = require('../config/redis');

// Create job queues for different conversion types
const conversionQueue = new Queue('pdf-conversions', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
    },
});

// OCR queue for text extraction
const ocrQueue = new Queue('ocr-processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    },
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 3000,
        },
        removeOnComplete: false,
        removeOnFail: false,
    },
});

// Queue event handlers
conversionQueue.on('error', (error) => {
    console.error('Conversion queue error:', error);
});

conversionQueue.on('waiting', (jobId) => {
    console.log(`Job ${jobId} is waiting`);
});

conversionQueue.on('active', (job) => {
    console.log(`Job ${job.id} has started processing`);
});

conversionQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed successfully`);
});

conversionQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
});

ocrQueue.on('error', (error) => {
    console.error('OCR queue error:', error);
});

// Helper function to add conversion job
const addConversionJob = async (jobData, priority = 'normal') => {
    const priorityMap = {
        high: 1,   // Premium users
        normal: 2, // Regular users
        low: 3,    // Free users
    };

    // Set timeout based on file size
    const fileSize = jobData.fileSize || 0;
    const timeout = Math.max(60000, Math.min(fileSize / 1000, 600000)); // 1-10 minutes

    const job = await conversionQueue.add(jobData, {
        priority: priorityMap[priority] || 2,
        timeout,
        jobId: jobData.jobId,
    });

    return job;
};

// Helper function to add OCR job
const addOcrJob = async (jobData, priority = 'normal') => {
    const priorityMap = {
        high: 1,
        normal: 2,
        low: 3,
    };

    const job = await ocrQueue.add(jobData, {
        priority: priorityMap[priority] || 2,
        timeout: 300000, // 5 minutes for OCR
        jobId: jobData.jobId,
    });

    return job;
};

// Helper function to get job status
const getJobStatus = async (jobId, queueType = 'conversion') => {
    const queue = queueType === 'ocr' ? ocrQueue : conversionQueue;

    try {
        const job = await queue.getJob(jobId);

        if (!job) {
            return { status: 'not_found', message: 'Job not found' };
        }

        const state = await job.getState();
        const progress = job.progress();

        return {
            status: state,
            progress,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
        };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
};

// Clean completed jobs older than 1 hour
const cleanOldJobs = async () => {
    const oneHour = 60 * 60 * 1000;

    await conversionQueue.clean(oneHour, 'completed');
    await conversionQueue.clean(oneHour * 24, 'failed'); // Keep failed jobs for 24 hours
    await ocrQueue.clean(oneHour, 'completed');
    await ocrQueue.clean(oneHour * 24, 'failed');

    console.log('✅ Cleaned old jobs from queues');
};

module.exports = {
    conversionQueue,
    ocrQueue,
    addConversionJob,
    addOcrJob,
    getJobStatus,
    cleanOldJobs,
};
