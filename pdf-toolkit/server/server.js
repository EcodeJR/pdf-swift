require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initCloudUpload } = require('./middleware/upload');
const { cleanupOldFiles } = require('./utils/fileManager');
const { initGridFS, cleanupExpiredFiles } = require('./utils/gridfsHelper');
const { fingerprintMiddleware, blockCheckMiddleware } = require('./middleware/deviceFingerprint');
const { cleanOldJobs } = require('./utils/jobQueue');
const { initializeWorkers } = require('./utils/ocrService');
const { configureLibreOffice, verifyLibreOffice, getLibreOfficeVersion } = require('./utils/libreofficeConfig');

// Import routes
const authRoutes = require('./routes/auth');
const convertRoutes = require('./routes/convert');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/user');
const jobRoutes = require('./routes/jobs');
const ocrRoutes = require('./routes/ocr');
const contactRoutes = require('./routes/contact');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // Join room for specific user
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });
});

// Connect to MongoDB
connectDB().then(async () => {
  // Initialize GridFS after successful DB connection
  try {
    initGridFS();
    console.log('✅ GridFS ready for cloud storage');
  } catch (error) {
    console.error('❌ GridFS initialization failed:', error);
  }

  // Configure LibreOffice for Word/Excel conversions
  try {
    configureLibreOffice();
    const isAccessible = await verifyLibreOffice();

    if (isAccessible) {
      const version = await getLibreOfficeVersion();
      console.log(`✅ LibreOffice ready: ${version}`);
    } else {
      console.warn('⚠️  LibreOffice not accessible - Word/Excel to PDF conversions may fail');
    }
  } catch (error) {
    console.error('❌ LibreOffice configuration failed:', error);
    console.warn('⚠️  Word/Excel to PDF conversions will not work without LibreOffice');
  }

  // Initialize OCR workers
  try {
    await initializeWorkers();
    console.log('✅ OCR workers initialized');
  } catch (error) {
    console.error('❌ OCR initialization failed:', error);
  }
});

// Initialize cloud upload after DB connection
initCloudUpload();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Device fingerprinting middleware (before rate limiting)
app.use(fingerprintMiddleware);

// Check if device is blocked
app.use(blockCheckMiddleware);

// Body parser middleware (except for webhook route)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'PDF Toolkit API is running',
    version: '2.0.0',
    features: ['Job Queue', 'OCR', 'Enhanced Rate Limiting'],
    endpoints: {
      auth: '/api/auth',
      convert: '/api/convert',
      payment: '/api/payment',
      user: '/api/user',
      jobs: '/api/jobs',
      ocr: '/api/ocr',
      contact: '/api/contact'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/contact', contactRoutes);

// Error handling middleware
app.use(errorHandler);

// Cleanup cron job - runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('🧹 Running cleanup job...');

  try {
    // Clean up local temporary files
    const uploadsPath = path.join(__dirname, 'uploads');
    const oneHour = 60 * 60 * 1000;
    const localResult = await cleanupOldFiles(uploadsPath, oneHour);
    console.log(`✅ Local cleanup: Deleted ${localResult.deleted} files, skipped ${localResult.skipped} active files.`);

    // Clean up expired GridFS files
    const gridfsDeleted = await cleanupExpiredFiles();
    console.log(`✅ GridFS cleanup: Deleted ${gridfsDeleted} expired files.`);

    // Clean up old jobs from queue
    await cleanOldJobs();
    console.log(`✅ Job queue cleanup completed`);

    console.log('✅ Cleanup job completed successfully.');
  } catch (error) {
    console.error('❌ Cleanup job error:', error);
  }
});



// Start server with Socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Socket.io enabled for real-time updates`);
  console.log(`🚀 Enhanced features: Job Queue | OCR | Advanced Rate Limiting`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📦 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
