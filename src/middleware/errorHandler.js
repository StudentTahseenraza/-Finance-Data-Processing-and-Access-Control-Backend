const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // Operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      code: err.errorCode,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_EXPIRED',
      message: 'Token expired',
    });
  }

  // Database errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Database validation failed',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      status: 'error',
      code: 'DUPLICATE_ERROR',
      message: 'Resource already exists',
    });
  }

  // Default error
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
};

module.exports = errorHandler;