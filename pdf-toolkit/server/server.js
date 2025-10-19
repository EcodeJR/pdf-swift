require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initCloudUpload } = require('./middleware/upload');

// Import routes
const authRoutes = require('./routes/auth');
const convertRoutes = require('./routes/convert');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/user');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Initialize cloud upload after DB connection
initCloudUpload();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

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
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      convert: '/api/convert',
      payment: '/api/payment',
      user: '/api/user'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);

// Error handling middleware
app.use(errorHandler);

// Cleanup cron job - runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running cleanup job...');
  
  try {
    const uploadsPath = path.join(__dirname, 'uploads');
    const files = await fs.readdir(uploadsPath);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadsPath, file);
      const stats = await fs.stat(filePath);
      const fileAge = now - stats.mtimeMs;
      
      // Delete files older than 1 hour
      if (fileAge > oneHour) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Cleanup completed. Deleted ${deletedCount} expired files.`);
  } catch (error) {
    console.error('Cleanup job error:', error);
  }
});

// Manual cleanup for testing
app.post('/api/cleanup', async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, 'uploads');
    const files = await fs.readdir(uploadsPath);
    
    for (const file of files) {
      await fs.unlink(path.join(uploadsPath, file));
    }
    
    res.json({ message: `Cleaned up ${files.length} files` });
  } catch (error) {
    res.status(500).json({ message: 'Cleanup failed', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
