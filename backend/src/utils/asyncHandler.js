/**
 * Utility for handling async errors in Express route handlers
 */
const logger = require('./logger');

/**
 * Wraps an async function to handle errors and pass them to Express's next()
 * Eliminates the need for try/catch blocks in every controller
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Higher-level wrapper that also logs error details
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function with error handling and logging
 */
function asyncHandlerWithLogging(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      logger.error(`Route error: ${req.method} ${req.originalUrl}`, {
        error: err.message,
        stack: err.stack,
        body: req.body,
        query: req.query,
        params: req.params
      });
      next(err);
    });
  };
}

/**
 * Creates async middleware that times execution and logs slow requests
 * 
 * @param {Function} fn - Async function to wrap
 * @param {number} threshold - Time threshold in ms to consider a request slow
 * @returns {Function} - Express middleware function with timing and error handling
 */
function timedAsyncHandler(fn, threshold = 1000) {
  return async (req, res, next) => {
    const start = Date.now();
    
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
      return;
    }
    
    const duration = Date.now() - start;
    if (duration > threshold) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`, {
        duration,
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        body: req.body
      });
    }
  };
}

/**
 * Creates a controller method that catches specific errors and
 * sends appropriate responses
 * 
 * @param {Function} fn - Controller function to wrap
 * @returns {Function} - Wrapped controller function
 */
function createController(fn) {
  return asyncHandler(async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (err) {
      // Handle different types of errors with specific status codes
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: err.errors || err.message
        });
      }
      
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      if (err.code === 11000) {
        // MongoDB duplicate key error
        return res.status(409).json({
          success: false,
          message: 'Duplicate resource'
        });
      }
      
      // Pass other errors to the default error handler
      next(err);
    }
  });
}

module.exports = {
  asyncHandler,
  asyncHandlerWithLogging,
  timedAsyncHandler,
  createController
}; 