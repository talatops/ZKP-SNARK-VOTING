const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes - Verify token
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Check if this is an admin token
      if (decoded.isAdmin) {
        const admin = await User.findById(decoded.id);
        if (!admin || !admin.isAdmin) {
          return res.status(401).json({
            success: false,
            message: 'Invalid token'
          });
        }
        req.user = admin;
      } else {
        // For voter tokens, we only have the nullifierHash
        req.user = { nullifierHash: decoded.nullifierHash };
      }
      
      next();
    } catch (error) {
      logger.error(`Token verification failed: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin only'
    });
  }
  next();
}; 