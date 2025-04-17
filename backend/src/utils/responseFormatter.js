/**
 * Utility for formatting HTTP responses consistently across the API
 */
const logger = require('./logger');

/**
 * Standard success response format
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {any} data - Optional data to include in response
 * @param {Object} meta - Optional metadata (pagination, etc.)
 * @returns {Object} - Formatted response
 */
function successResponse(res, statusCode = 200, message = 'Success', data = null, meta = null) {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Standard error response format
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {any} errors - Optional detailed errors
 * @returns {Object} - Formatted error response
 */
function errorResponse(res, statusCode = 500, message = 'Server error', errors = null) {
  const response = {
    success: false,
    message
  };
  
  if (errors !== null) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Create a 400 Bad Request response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {any} errors - Optional validation errors
 * @returns {Object} - Formatted bad request response
 */
function badRequestResponse(res, message = 'Bad request', errors = null) {
  return errorResponse(res, 400, message, errors);
}

/**
 * Create a 401 Unauthorized response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Formatted unauthorized response
 */
function unauthorizedResponse(res, message = 'Unauthorized') {
  return errorResponse(res, 401, message);
}

/**
 * Create a 403 Forbidden response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Formatted forbidden response
 */
function forbiddenResponse(res, message = 'Forbidden') {
  return errorResponse(res, 403, message);
}

/**
 * Create a 404 Not Found response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Formatted not found response
 */
function notFoundResponse(res, message = 'Resource not found') {
  return errorResponse(res, 404, message);
}

/**
 * Create a 409 Conflict response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Formatted conflict response
 */
function conflictResponse(res, message = 'Resource conflict') {
  return errorResponse(res, 409, message);
}

/**
 * Create a 429 Too Many Requests response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} - Formatted rate limit response
 */
function rateLimitResponse(res, message = 'Too many requests') {
  return errorResponse(res, 429, message);
}

/**
 * Create a 500 Internal Server Error response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Error} error - Original error object
 * @returns {Object} - Formatted server error response
 */
function serverErrorResponse(res, message = 'Internal server error', error = null) {
  // Log the original error
  if (error) {
    logger.error(`Server error: ${message}`, { error: error.stack || error.message });
  }
  
  return errorResponse(res, 500, message);
}

/**
 * Create a pagination metadata object
 * 
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Object} - Pagination metadata
 */
function paginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

module.exports = {
  successResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  rateLimitResponse,
  serverErrorResponse,
  paginationMeta
}; 