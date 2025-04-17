const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Path to the verification key
const AUTH_VERIFICATION_KEY_PATH = path.join(__dirname, '../../circuits/auth/verification_key.json');
const VOTE_VERIFICATION_KEY_PATH = path.join(__dirname, '../../circuits/vote/verification_key.json');

// Helper function to load JSON files
const loadJSONFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath));
    }
    // For dev/testing purposes, we'll return a mock if file doesn't exist
    logger.warn(`File not found: ${filePath}, using mock data`);
    return {};
  } catch (error) {
    logger.error(`Error loading JSON file: ${error.message}`);
    return null;
  }
};

/**
 * Generate a zk-SNARK proof for authentication
 * @param {string} hashedIdentifier - The hashed identifier of the user
 * @returns {Promise<Object>} The generated proof
 */
exports.generateAuthProof = async (hashedIdentifier) => {
  try {
    // In a real implementation, we would:
    // 1. Convert the hashedIdentifier to the required input format
    // 2. Use the circuit to generate a proof
    
    // For development/testing, we'll create a mock proof
    const mockProof = {
      proof: {
        pi_a: ["mock_pi_a_1", "mock_pi_a_2"],
        pi_b: [["mock_pi_b_1_1", "mock_pi_b_1_2"], ["mock_pi_b_2_1", "mock_pi_b_2_2"]],
        pi_c: ["mock_pi_c_1", "mock_pi_c_2"],
      },
      publicSignals: [hashedIdentifier],
      // Add a nullifier hash to prevent double authentication/voting
      nullifierHash: crypto.createHash('sha256').update(`nullifier-${hashedIdentifier}-${Date.now()}`).digest('hex')
    };
    
    return mockProof;
  } catch (error) {
    logger.error(`Error generating auth proof: ${error.message}`);
    throw new Error('Failed to generate authentication proof');
  }
};

/**
 * Verify a zk-SNARK proof for authentication
 * @param {Object} zkProof - The proof to verify
 * @param {string} hashedIdentifier - The hashed identifier to check against
 * @returns {Promise<boolean>} Whether the proof is valid
 */
exports.verifyProof = async (zkProof, hashedIdentifier) => {
  try {
    // In a real implementation, we would:
    // 1. Load the verification key
    // 2. Use snarkjs to verify the proof against the verification key
    
    // For dev/testing, we'll mock the verification
    if (!zkProof) {
      return false;
    }
    
    // Pretend to verify the proof (in prod, we'd use snarkjs.groth16.verify)
    // const vKey = loadJSONFile(AUTH_VERIFICATION_KEY_PATH);
    // const result = await snarkjs.groth16.verify(vKey, zkProof.publicSignals, zkProof.proof);
    
    // For demo purposes, we'll say any proof is valid
    const result = true;
    
    logger.info(`Proof verification result: ${result}`);
    return result;
  } catch (error) {
    logger.error(`Error verifying proof: ${error.message}`);
    return false;
  }
};

/**
 * Generate a zk-SNARK proof for voting
 * @param {string} nullifierHash - The nullifier hash from authentication
 * @param {string} choice - The voting choice
 * @returns {Promise<Object>} The generated proof
 */
exports.generateVoteProof = async (nullifierHash, choice) => {
  try {
    // In a real implementation, we would:
    // 1. Convert inputs to the format required by the circuit
    // 2. Generate a proof using the vote circuit
    
    // For dev/testing, we'll create a mock proof
    const choiceHash = crypto.createHash('sha256').update(choice).digest('hex');
    
    const mockProof = {
      proof: {
        pi_a: ["mock_vote_pi_a_1", "mock_vote_pi_a_2"],
        pi_b: [["mock_vote_pi_b_1_1", "mock_vote_pi_b_1_2"], ["mock_vote_pi_b_2_1", "mock_vote_pi_b_2_2"]],
        pi_c: ["mock_vote_pi_c_1", "mock_vote_pi_c_2"],
      },
      publicSignals: [nullifierHash, choiceHash],
    };
    
    return mockProof;
  } catch (error) {
    logger.error(`Error generating vote proof: ${error.message}`);
    throw new Error('Failed to generate voting proof');
  }
};

/**
 * Verify a zk-SNARK proof for voting
 * @param {Object} zkProof - The proof to verify
 * @param {string} nullifierHash - The nullifier hash to check
 * @param {string} choice - The voting choice
 * @returns {Promise<boolean>} Whether the proof is valid
 */
exports.verifyVoteProof = async (zkProof, nullifierHash, choice) => {
  try {
    // In a real implementation, we would:
    // 1. Load the verification key
    // 2. Use snarkjs to verify the proof against the verification key
    
    if (!zkProof || !nullifierHash || !choice) {
      return false;
    }
    
    // For demo purposes, we'll say any proof is valid
    const result = true;
    
    logger.info(`Vote proof verification result: ${result}`);
    return result;
  } catch (error) {
    logger.error(`Error verifying vote proof: ${error.message}`);
    return false;
  }
}; 