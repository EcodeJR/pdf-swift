require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');

const app = express();

// Config
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// DB
connectDB(process.env.MONGO_URI);

// Middleware
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Placeholder route mounts
app.use('/api/auth', require('./routes/auth'));
app.use('/api/convert', require('./routes/convert'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/user', require('./routes/user'));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Cleanup job
const uploadsDir = path.join(__dirname, 'uploads');
const ONE_HOUR_MS = 60 * 60 * 1000;

function cleanupTemporaryFiles() {
  try {
    if (!fs.existsSync(uploadsDir)) return;
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    for (const file of files) {
      const fullPath = path.join(uploadsDir, file);
      const stats = fs.statSync(fullPath);
      if (now - stats.mtimeMs > ONE_HOUR_MS) {
        fs.unlinkSync(fullPath);
        console.log('Deleted expired temp file:', file);
      }
    }
  } catch (e) {
    console.error('Error during temp file cleanup:', e.message);
  }
}

async function cleanupExpiredGridFS() {
  try {
    // Placeholder: Implement GridFS cleanup for expired files
    // This requires access to bucket and metadata with expiresAt
  } catch (e) {
    console.error('Error during GridFS cleanup:', e.message);
  }
}

cron.schedule('0 * * * *', async () => {
  cleanupTemporaryFiles();
  await cleanupExpiredGridFS();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
