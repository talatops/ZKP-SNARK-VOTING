/**
 * Authentication utilities for JWT token handling
 */
const jwt = require('jsonwebtoken');

// Secret keys for JWT signing
// In production, these should be securely stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'voting-system-secret-key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key';

/**
 * Generate a JWT token for regular voters
 * 
 * @param {Object} user - User object with id and other properties
 * @returns {string} - JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id,
      role: 'voter'
    }, 
    JWT_SECRET, 
    { expiresIn: '2h' }
  );
}

/**
 * Generate a JWT token for admin users
 * 
 * @param {Object} admin - Admin user object
 * @returns {string} - JWT token
 */
function generateAdminToken(admin) {
  return jwt.sign(
    { 
      id: admin.id,
      role: 'admin'
    }, 
    ADMIN_JWT_SECRET, 
    { expiresIn: '4h' }
  );
}

/**
 * Verify a user JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Verify an admin JWT token
 * 
 * @param {string} token - Admin JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyAdminToken(token) {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET);
  } catch (error) {
    console.error('Admin token verification failed:', error.message);
    return null;
  }
}

module.exports = {
  generateToken,
  generateAdminToken,
  verifyToken,
  verifyAdminToken
}; 