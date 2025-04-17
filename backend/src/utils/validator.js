/**
 * Validation utilities for input sanitization and verification
 */

// Regular expression patterns for validation
const PATTERNS = {
  // Username: alphanumeric with underscore and dash, 3-30 chars
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  
  // Email: standard email validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // UUID: standard UUID v4 format
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // ObjectId: MongoDB ObjectId format (24 hex chars)
  OBJECTID: /^[0-9a-fA-F]{24}$/,
  
  // Hash: SHA-256 hash format (64 hex chars)
  SHA256: /^[0-9a-fA-F]{64}$/,
  
  // Ethereum transaction hash (66 chars including 0x prefix)
  ETH_HASH: /^0x[0-9a-fA-F]{64}$/
};

/**
 * Validates that the input is a non-empty string
 * 
 * @param {any} input - The input to validate
 * @returns {boolean} - Whether the input is valid
 */
function isString(input) {
  return typeof input === 'string' && input.trim().length > 0;
}

/**
 * Validates that the input matches the given pattern
 * 
 * @param {string} input - The string to validate
 * @param {RegExp} pattern - The regular expression pattern to match against
 * @returns {boolean} - Whether the input matches the pattern
 */
function matchesPattern(input, pattern) {
  if (!isString(input)) return false;
  return pattern.test(input);
}

/**
 * Validates an object against a schema
 * 
 * @param {Object} data - The object to validate
 * @param {Object} schema - Schema with field names and validator functions
 * @returns {Object} - Object with isValid flag and errors array
 */
function validateObject(data, schema) {
  if (typeof data !== 'object' || data === null) {
    return { isValid: false, errors: ['Invalid input: Expected an object'] };
  }

  const errors = [];
  
  // Check each field in the schema
  Object.entries(schema).forEach(([field, validator]) => {
    if (typeof validator === 'function') {
      const value = data[field];
      // If field is required or value exists, validate it
      if (validator.required || value !== undefined) {
        if (!validator(value)) {
          errors.push(`Invalid value for field '${field}'`);
        }
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes an object by removing fields not in the whitelist
 * 
 * @param {Object} data - The object to sanitize
 * @param {string[]} allowedFields - Array of allowed field names
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(data, allowedFields) {
  if (typeof data !== 'object' || data === null) {
    return {};
  }
  
  const sanitized = {};
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  });
  
  return sanitized;
}

/**
 * Validates a SHA-256 hash
 * 
 * @param {string} hash - The hash to validate
 * @returns {boolean} - Whether the hash is valid
 */
function isValidHash(hash) {
  return matchesPattern(hash, PATTERNS.SHA256);
}

/**
 * Validates a MongoDB ObjectId
 * 
 * @param {string} id - The ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
function isValidObjectId(id) {
  return matchesPattern(id, PATTERNS.OBJECTID);
}

/**
 * Validates an Ethereum transaction hash
 * 
 * @param {string} hash - The transaction hash to validate
 * @returns {boolean} - Whether the hash is valid
 */
function isValidTransactionHash(hash) {
  return matchesPattern(hash, PATTERNS.ETH_HASH);
}

/**
 * Creates a required validator function
 * 
 * @param {Function} validatorFn - The validator function
 * @returns {Function} - Enhanced validator function with required flag
 */
function required(validatorFn) {
  const enhancedValidator = (value) => {
    return value !== undefined && value !== null && validatorFn(value);
  };
  enhancedValidator.required = true;
  return enhancedValidator;
}

module.exports = {
  PATTERNS,
  isString,
  matchesPattern,
  validateObject,
  sanitizeObject,
  isValidHash,
  isValidObjectId,
  isValidTransactionHash,
  required
}; 