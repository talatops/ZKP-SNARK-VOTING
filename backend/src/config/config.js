/**
 * Centralized configuration file for all environment variables and settings
 */
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

// Default configurations with fallbacks for missing environment variables
const config = {
  // Server settings
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  
  // Database settings
  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/zk-auth-voting',
    mongoOptions: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // Authentication and security settings
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'voting-system-secret-key',
    adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'admin-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
    adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '4h',
    encryptionKey: process.env.ENCRYPTION_KEY || 'voting-system-encryption-key-32-bytes',
  },
  
  // Blockchain settings
  blockchain: {
    network: process.env.ETHEREUM_NETWORK || 'sepolia',
    infuraKey: process.env.INFURA_KEY || '',
    privateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      path: path.join(__dirname, '../../logs/app.log'),
      maxSize: 5242880, // 5MB
      maxFiles: 5,
    }
  },
  
  // Rate limiting settings
  rateLimit: {
    global: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
    },
    auth: {
      maxAttempts: parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 10) || 5,
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 300000, // 5 minutes
    }
  },
  
  // Circuit and proof settings
  zkp: {
    authCircuitPath: path.join(__dirname, '../../circuits/auth'),
    voteCircuitPath: path.join(__dirname, '../../circuits/vote'),
    verificationKeyPath: {
      auth: path.join(__dirname, '../../circuits/auth/verification_key.json'),
      vote: path.join(__dirname, '../../circuits/vote/verification_key.json'),
    }
  }
};

// Environment-specific configurations
if (config.server.nodeEnv === 'development') {
  // Development-specific overrides
  config.logging.level = 'debug';
} else if (config.server.nodeEnv === 'production') {
  // Production-specific overrides
  config.server.corsOrigin = process.env.CORS_ORIGIN || 'https://yourdomain.com';
  config.logging.level = process.env.LOG_LEVEL || 'warn';
}

// Security validation - ensure sensitive config values aren't default in production
if (config.server.nodeEnv === 'production') {
  const checks = [
    { key: 'auth.jwtSecret', defaultValue: 'voting-system-secret-key' },
    { key: 'auth.adminJwtSecret', defaultValue: 'admin-secret-key' },
    { key: 'auth.encryptionKey', defaultValue: 'voting-system-encryption-key-32-bytes' },
  ];
  
  checks.forEach(check => {
    // Use lodash-like path traversal
    const getValue = (obj, path) => {
      const keys = path.split('.');
      return keys.reduce((o, k) => (o || {})[k], obj);
    };
    
    if (getValue(config, check.key) === check.defaultValue) {
      console.warn(`WARNING: Default ${check.key} being used in production!`);
    }
  });
}

module.exports = config; 