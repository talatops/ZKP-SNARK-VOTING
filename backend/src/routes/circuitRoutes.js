const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Routes to serve circuit artifacts (wasm and zkey files) to the frontend
 * These are needed for generating real ZK proofs in the browser
 */

// Helper function to serve circuit files
const serveCircuitFile = (circuitName, fileType) => {
  return (req, res) => {
    const filePath = path.join(
      __dirname,
      '../../../circuits',
      circuitName,
      `${circuitName}${fileType === 'zkey' ? '_final.zkey' : '.wasm'}`
    );
    
    logger.info(`Serving ${fileType} file for ${circuitName} circuit`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      logger.error(`Circuit file not found: ${filePath}`);
      res.status(404).json({ 
        success: false, 
        message: `${fileType.toUpperCase()} file for ${circuitName} circuit not found` 
      });
    }
  };
};

// Define routes for each circuit file
router.get('/auth/auth.wasm', serveCircuitFile('auth', 'wasm'));
router.get('/auth/auth_final.zkey', serveCircuitFile('auth', 'zkey'));

router.get('/vote/vote.wasm', serveCircuitFile('vote', 'wasm'));
router.get('/vote/vote_final.zkey', serveCircuitFile('vote', 'zkey'));

router.get('/admin/admin.wasm', serveCircuitFile('admin', 'wasm'));
router.get('/admin/admin_final.zkey', serveCircuitFile('admin', 'zkey'));

// Verification key routes
router.get('/auth/verification_key.json', (req, res) => {
  const filePath = path.join(__dirname, '../../../circuits/auth/verification_key.json');
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Verification key not found' });
  }
});

router.get('/vote/verification_key.json', (req, res) => {
  const filePath = path.join(__dirname, '../../../circuits/vote/verification_key.json');
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Verification key not found' });
  }
});

router.get('/admin/verification_key.json', (req, res) => {
  const filePath = path.join(__dirname, '../../../circuits/admin/verification_key.json');
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Verification key not found' });
  }
});

module.exports = router; 