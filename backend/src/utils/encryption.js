/**
 * Encryption utilities for secure data handling
 */
const crypto = require('crypto');

// Encryption settings
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const KEY = process.env.ENCRYPTION_KEY || 'voting-system-encryption-key-32-bytes';

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param {string|Object} data - Data to encrypt (objects will be stringified)
 * @returns {string} - Encrypted data as a hex string with IV and auth tag
 */
function encrypt(data) {
  // Convert objects to strings if needed
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  // Generate random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
  
  // Encrypt the data
  let encrypted = cipher.update(dataString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Return IV + authTag + encrypted data as hex string
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data encrypted with the encrypt function
 * 
 * @param {string} encryptedData - Data to decrypt (format: iv:authTag:encryptedData)
 * @param {boolean} parseJson - Whether to parse the result as JSON
 * @returns {string|Object|null} - Decrypted data or null if decryption fails
 */
function decrypt(encryptedData, parseJson = false) {
  try {
    // Split components
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse as JSON if requested
    if (parseJson) {
      return JSON.parse(decrypted);
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}

/**
 * Generate a secure hash of data using SHA-256
 * 
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  hash
}; 