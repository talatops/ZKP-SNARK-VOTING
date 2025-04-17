const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Path to the contract ABI
const CONTRACT_ABI_PATH = path.join(__dirname, '../../contracts/VotingContract.json');
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Helper function to load JSON files
const loadJSONFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath));
    }
    logger.warn(`File not found: ${filePath}, using mock data`);
    return { abi: [] };
  } catch (error) {
    logger.error(`Error loading JSON file: ${error.message}`);
    return { abi: [] };
  }
};

// Initialize Ethereum provider and contract
let provider;
let contract;
let wallet;
let isConnected = false;

const initEthereumConnection = () => {
  // Skip real initialization in development mode
  if (isDevelopment) {
    logger.info('Development mode: Using mock blockchain connection');
    isConnected = true;
    return true;
  }
  
  try {
    const infuraKey = process.env.INFURA_KEY || '';
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY || '';
    
    // Use Infura as provider for Ethereum network (can use other providers too)
    provider = new ethers.InfuraProvider(
      process.env.ETHEREUM_NETWORK || 'sepolia',
      infuraKey
    );
    
    // Create wallet from private key
    wallet = new ethers.Wallet(privateKey, provider);
    
    // Load contract ABI
    const contractData = loadJSONFile(CONTRACT_ABI_PATH);
    
    // Create contract instance
    contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractData.abi,
      wallet
    );
    
    logger.info('Ethereum connection initialized');
    isConnected = true;
    return true;
  } catch (error) {
    logger.error(`Failed to initialize Ethereum connection: ${error.message}`);
    // In development mode, we can still proceed with mock data
    if (isDevelopment) {
      logger.info('Falling back to mock blockchain in development mode');
      isConnected = true;
      return true;
    }
    return false;
  }
};

// Initialize connection on module import
initEthereumConnection();

/**
 * Submit a vote to the blockchain
 * @param {string} nullifierHash - The nullifier hash to prevent double voting
 * @param {string} choice - The voting choice
 * @param {Object} zkProof - The zero-knowledge proof
 * @returns {Promise<string>} The transaction hash
 */
exports.submitVote = async (nullifierHash, choice, zkProof) => {
  try {
    // In development/testing mode, we'll simulate blockchain submission
    if (isDevelopment) {
      logger.info('Simulating blockchain vote submission');
      // Return a mock transaction hash
      return `0x${crypto.randomBytes(32).toString('hex')}`;
    }
    
    if (!isConnected || !contract) {
      throw new Error('Ethereum connection not initialized');
    }
    
    // Convert the proof to the format expected by the smart contract
    const proofForContract = [
      zkProof.proof.pi_a,
      zkProof.proof.pi_b,
      zkProof.proof.pi_c,
      zkProof.publicSignals
    ];
    
    // Submit vote to the blockchain
    const tx = await contract.castVote(nullifierHash, choice, proofForContract);
    await tx.wait(); // Wait for transaction to be mined
    
    logger.info(`Vote submitted to blockchain: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    logger.error(`Error submitting vote to blockchain: ${error.message}`);
    if (isDevelopment) {
      logger.info('Returning mock transaction hash for development');
      return `0x${crypto.randomBytes(32).toString('hex')}`;
    }
    throw new Error('Failed to submit vote to blockchain');
  }
};

/**
 * Get the total vote count from the blockchain
 * @returns {Promise<number>} The total vote count
 */
exports.getTotalVotes = async () => {
  try {
    // In development/testing mode, we'll return a mock value
    if (isDevelopment) {
      return 42; // Mock value
    }
    
    if (!isConnected || !contract) {
      throw new Error('Ethereum connection not initialized');
    }
    
    const totalVotes = await contract.getTotalVotes();
    return totalVotes.toNumber();
  } catch (error) {
    logger.error(`Error getting total votes from blockchain: ${error.message}`);
    if (isDevelopment) {
      return 42; // Mock value for development
    }
    throw new Error('Failed to get total votes from blockchain');
  }
};

/**
 * Verify that a vote has been recorded on the blockchain
 * @param {string} nullifierHash - The nullifier hash to check
 * @returns {Promise<boolean>} Whether the vote is recorded
 */
exports.verifyVote = async (nullifierHash) => {
  try {
    // In development/testing mode, we'll return true
    if (isDevelopment) {
      return true;
    }
    
    if (!isConnected || !contract) {
      throw new Error('Ethereum connection not initialized');
    }
    
    const isVoted = await contract.hasVoted(nullifierHash);
    return isVoted;
  } catch (error) {
    logger.error(`Error verifying vote on blockchain: ${error.message}`);
    if (isDevelopment) {
      return true; // Mock response for development
    }
    throw new Error('Failed to verify vote on blockchain');
  }
}; 