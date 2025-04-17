const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const logger = require('../utils/logger');
const zkpService = require('../services/zkpService');

// Helper to log system events
const logSystemEvent = async (level, message, details = '') => {
  try {
    await SystemLog.create({
      level,
      message,
      details
    });
  } catch (error) {
    logger.error(`Failed to log event: ${error.message}`);
  }
};

// Register a voter with a hashed identifier
exports.registerVoter = async (req, res, next) => {
  try {
    const { hashedIdentifier } = req.body;

    if (!hashedIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a hashed identifier'
      });
    }

    // Hash the identifier again on the server for additional security
    const serverHashedId = crypto
      .createHash('sha256')
      .update(hashedIdentifier)
      .digest('hex');

    // Check if user already exists
    let user = await User.findOne({ hashedIdentifier: serverHashedId });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Voter already registered'
      });
    }

    // Create new user
    user = await User.create({
      hashedIdentifier: serverHashedId,
      isAdmin: false
    });

    await logSystemEvent('INFO', 'New voter registered', 'Anonymous voter registration successful');

    res.status(201).json({
      success: true,
      message: 'Voter registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Authenticate a voter using zk-SNARK proof
exports.authenticateVoter = async (req, res, next) => {
  try {
    const { hashedIdentifier, zkProof } = req.body;

    if (!hashedIdentifier || !zkProof) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both hashed identifier and zkProof'
      });
    }

    // Hash the identifier again on the server
    const serverHashedId = crypto
      .createHash('sha256')
      .update(hashedIdentifier)
      .digest('hex');

    // Find the user
    const user = await User.findOne({ hashedIdentifier: serverHashedId });

    if (!user) {
      await logSystemEvent('WARN', 'Failed login attempt', 'Invalid identifier provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Verify the zero-knowledge proof
    const isProofValid = await zkpService.verifyProof(zkProof, hashedIdentifier);

    if (!isProofValid) {
      await logSystemEvent('WARN', 'Failed login attempt', 'Invalid proof provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { nullifierHash: zkProof.nullifierHash },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    await logSystemEvent('INFO', 'User authentication successful', 'Proof verification completed successfully');

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Administrator login
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password'
      });
    }

    // Find admin user
    const admin = await User.findOne({ username, isAdmin: true });

    if (!admin) {
      await logSystemEvent('WARN', 'Failed admin login attempt', 'Invalid username');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // For demo purposes, we'll use a simple password check
    // In production, use proper password hashing (bcrypt)
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (passwordHash !== admin.passwordHash) {
      await logSystemEvent('WARN', 'Failed admin login attempt', 'Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate admin token
    const token = jwt.sign(
      { id: admin._id, isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    await logSystemEvent('INFO', 'Admin login successful', `Admin user: ${username}`);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Initialize admin account if none exists
exports.initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ isAdmin: true });

    if (!adminExists) {
      // Create default admin account
      const passwordHash = crypto
        .createHash('sha256')
        .update('adminpassword')
        .digest('hex');

      await User.create({
        hashedIdentifier: 'admin-identifier',
        isAdmin: true,
        username: 'admin',
        passwordHash
      });

      logger.info('Default admin account created');
    }
  } catch (error) {
    logger.error(`Failed to initialize admin: ${error.message}`);
  }
}; 