const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
const { verifyProof } = require('./utils/zkProofVerifier');
const swaggerDocument = require('./swagger.json');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-dev-only';

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mock database for demonstration (replace with real database in production)
const voters = [
  { id: 'voter1', commitment: 'commitment1', hasVoted: false },
  { id: 'voter2', commitment: 'commitment2', hasVoted: false }
];

const adminUsers = [
  { username: 'admin', password: 'admin123', isAdmin: true }
];

const votes = [];
const nullifierHashes = new Set();

// Authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization header required' });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { voterId } = req.body;
  
  // In a real implementation, this would generate and verify a zk-SNARK proof
  // Here we'll simulate with a simple lookup
  const voter = voters.find(v => v.id === voterId);
  
  if (!voter) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
  
  // Generate a nullifier hash (in a real implementation, this would be part of the proof)
  const nullifierHash = `nullifier_${voterId}_${Date.now()}`;
  
  // Create JWT token
  const token = jwt.sign(
    { id: voter.id, nullifierHash },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ token, nullifierHash });
});

app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  const admin = adminUsers.find(a => a.username === username && a.password === password);
  
  if (!admin) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
  
  const token = jwt.sign(
    { username: admin.username, isAdmin: admin.isAdmin },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ token, isAdmin: true });
});

app.get('/api/auth/verify', authenticateJWT, (req, res) => {
  res.json({ 
    valid: true, 
    isAdmin: req.user.isAdmin || false 
  });
});

app.post('/api/voting/cast', authenticateJWT, (req, res) => {
  const { vote, nullifierHash, proof } = req.body;
  
  // Check if nullifier hash exists (prevent double voting)
  if (nullifierHashes.has(nullifierHash)) {
    return res.status(409).json({ message: 'You have already voted' });
  }
  
  // In a real implementation, verify the zk-SNARK proof
  // Simulating proof verification here
  const isProofValid = true; // verifyProof(proof, nullifierHash);
  
  if (!isProofValid) {
    return res.status(400).json({ message: 'Invalid proof' });
  }
  
  // Record the vote
  votes.push({ vote, nullifierHash, timestamp: new Date() });
  nullifierHashes.add(nullifierHash);
  
  // Mark voter as having voted in our mock database
  // In a real implementation, we wouldn't know which voter this is
  const voter = voters.find(v => req.user.id === v.id);
  if (voter) {
    voter.hasVoted = true;
  }
  
  // In a real implementation, this would also publish the vote to the blockchain
  // Simulate blockchain transaction
  const transactionHash = `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  
  res.json({ 
    success: true, 
    transactionHash 
  });
});

app.get('/api/voting/status', authenticateJWT, (req, res) => {
  const { nullifierHash } = req.query;
  
  const hasVoted = nullifierHashes.has(nullifierHash);
  
  res.json({ hasVoted });
});

app.get('/api/admin/logs', authenticateJWT, isAdmin, (req, res) => {
  const { timeFrame = '24h', page = 1, limit = 50 } = req.query;
  
  // In a real implementation, this would query logs from a database
  // Mock logs for demonstration
  const logs = [
    { timestamp: new Date(), level: 'info', message: 'Server started', meta: {} },
    { timestamp: new Date(), level: 'info', message: 'Vote cast successfully', meta: { nullifierHash: 'sample_hash' } }
  ];
  
  const total = logs.length;
  const pages = Math.ceil(total / limit);
  
  res.json({
    logs,
    pagination: {
      total,
      pages,
      current: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

app.get('/api/admin/status', authenticateJWT, isAdmin, (req, res) => {
  // In a real implementation, this would query actual system stats
  // Mock stats for demonstration
  res.json({
    totalVotes: votes.length,
    uptime: process.uptime(),
    blockchainStatus: 'connected',
    databaseStatus: 'connected',
    voteDistribution: {
      'option1': votes.filter(v => v.vote === 'option1').length,
      'option2': votes.filter(v => v.vote === 'option2').length
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app; // For testing purposes 