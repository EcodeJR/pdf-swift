const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File size too large. Free users: 10MB max, Premium users: 50MB max.',
      error: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      message: 'Too many files uploaded.',
      error: 'TOO_MANY_FILES'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Email already exists. Please use a different email or login.',
      error: 'DUPLICATE_EMAIL'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      error: 'TOKEN_EXPIRED'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
