/**
 * Utility for generating unique identifiers and secrets
 */
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { encrypt, hash } = require('./encryption');

/**
 * Generate a cryptographically secure random string
 * 
 * @param {number} length - Length of the random string
 * @returns {string} - Random string in hex format
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generate a UUID v4
 * 
 * @returns {string} - UUID v4 string
 */
function generateUUID() {
  return uuidv4();
}

/**
 * Generate a voter identifier with optional prefix
 * 
 * @param {string} prefix - Optional prefix for the identifier
 * @returns {string} - Unique voter identifier
 */
function generateVoterId(prefix = 'voter') {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * Generate a secure secret key
 * 
 * @param {number} length - Length of the key in bytes
 * @returns {string} - Secret key in base64 format
 */
function generateSecretKey(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate a nullifier hash from a voter ID
 * This is used to prevent double voting while preserving anonymity
 * 
 * @param {string} voterId - The voter's identifier
 * @param {string} secret - A secret only known to the voter
 * @returns {string} - Nullifier hash
 */
function generateNullifierHash(voterId, secret) {
  return hash(`${voterId}-${secret}-nullifier`);
}

/**
 * Generate a commitment for a vote
 * Used in the zero-knowledge proof system
 * 
 * @param {string} voterId - The voter's identifier
 * @param {string} choice - The voter's choice
 * @param {string} secret - A secret only known to the voter
 * @returns {string} - Commitment hash
 */
function generateVoteCommitment(voterId, choice, secret) {
  return hash(`${voterId}-${choice}-${secret}-commitment`);
}

/**
 * Generate a secure token with payload
 * 
 * @param {Object} payload - Data to include in the token
 * @returns {string} - Encrypted token
 */
function generateSecureToken(payload) {
  // Add timestamp and unique ID to prevent replay attacks
  const tokenData = {
    ...payload,
    timestamp: Date.now(),
    tokenId: generateUUID()
  };
  
  return encrypt(tokenData);
}

module.exports = {
  generateRandomString,
  generateUUID,
  generateVoterId,
  generateSecretKey,
  generateNullifierHash,
  generateVoteCommitment,
  generateSecureToken
}; 