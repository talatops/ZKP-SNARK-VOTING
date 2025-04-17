const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../utils/rateLimiter');
const { createController } = require('../utils/asyncHandler');
const config = require('../config/config');

const router = express.Router();

// Apply auth-specific rate limiting to all authentication routes
const authRateLimiter = authLimiter(
  config.rateLimit.auth.maxAttempts,
  config.rateLimit.auth.windowMs
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new voter
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hashedIdentifier
 *             properties:
 *               hashedIdentifier:
 *                 type: string
 *                 description: The hashed identifier of the voter
 *     responses:
 *       201:
 *         description: Voter registered successfully
 *       400:
 *         description: Bad request, missing required fields
 *       500:
 *         description: Server error
 */
router.post('/register', authRateLimiter, createController(authController.registerVoter));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a voter using zk-SNARK proof
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hashedIdentifier
 *               - zkProof
 *             properties:
 *               hashedIdentifier:
 *                 type: string
 *                 description: The hashed identifier of the voter
 *               zkProof:
 *                 type: object
 *                 description: The zero-knowledge proof object
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
router.post('/login', authRateLimiter, createController(authController.authenticateVoter));

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Administrator login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/admin/login', authRateLimiter, createController(authController.adminLogin));

module.exports = router; 