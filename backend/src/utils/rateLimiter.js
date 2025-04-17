/**
 * Rate limiting utilities to protect against brute force attacks
 */
const logger = require('./logger');

// In-memory store for rate limiting
// In a production environment, use Redis or another distributed cache
const ipRequestMap = new Map();
const routeMap = new Map();

/**
 * Clears expired rate limiting entries
 * Should be called periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  
  // Clean IP-based entries
  for (const [ip, data] of ipRequestMap.entries()) {
    if (data.resetTime < now) {
      ipRequestMap.delete(ip);
    }
  }
  
  // Clean route-specific entries
  for (const [route, ipMap] of routeMap.entries()) {
    for (const [ip, data] of ipMap.entries()) {
      if (data.resetTime < now) {
        ipMap.delete(ip);
      }
    }
    
    // If the route's IP map is empty, remove the route entry
    if (ipMap.size === 0) {
      routeMap.delete(route);
    }
  }
}

/**
 * Global rate limiter for all API endpoints
 * Limits requests per IP address across the entire API
 * 
 * @param {number} maxRequests - Maximum requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} - Express middleware function
 */
function globalLimiter(maxRequests = 100, windowMs = 60000) {
  // Run cleanup every 5 minutes
  setInterval(cleanupExpiredEntries, 300000);
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Get or initialize request data for this IP
    let requestData = ipRequestMap.get(ip);
    
    if (!requestData || requestData.resetTime < now) {
      // If no data or expired, create new entry
      requestData = {
        count: 1,
        resetTime: now + windowMs
      };
      ipRequestMap.set(ip, requestData);
      return next();
    }
    
    // Increment request count
    requestData.count++;
    
    // Check if limit is exceeded
    if (requestData.count > maxRequests) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.'
      });
    }
    
    return next();
  };
}

/**
 * Route-specific rate limiter
 * Limits requests to specific endpoints
 * 
 * @param {number} maxRequests - Maximum requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} - Express middleware function
 */
function routeLimiter(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const route = req.originalUrl || req.url;
    const now = Date.now();
    
    // Get or initialize the IP map for this route
    let ipMap = routeMap.get(route);
    if (!ipMap) {
      ipMap = new Map();
      routeMap.set(route, ipMap);
    }
    
    // Get or initialize request data for this IP on this route
    let requestData = ipMap.get(ip);
    
    if (!requestData || requestData.resetTime < now) {
      // If no data or expired, create new entry
      requestData = {
        count: 1,
        resetTime: now + windowMs
      };
      ipMap.set(ip, requestData);
      return next();
    }
    
    // Increment request count
    requestData.count++;
    
    // Check if limit is exceeded
    if (requestData.count > maxRequests) {
      logger.warn(`Route-specific rate limit exceeded. IP: ${ip}, Route: ${route}`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests to this endpoint, please try again later.'
      });
    }
    
    return next();
  };
}

/**
 * Auth-specific rate limiter
 * Applies stricter limits to authentication endpoints to prevent brute force attacks
 * 
 * @param {number} maxAttempts - Maximum login attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} - Express middleware function
 */
function authLimiter(maxAttempts = 5, windowMs = 300000) {
  return routeLimiter(maxAttempts, windowMs);
}

module.exports = {
  globalLimiter,
  routeLimiter,
  authLimiter,
  cleanupExpiredEntries
}; 