const express = require('express');
const voteController = require('../controllers/voteController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/vote/cast:
 *   post:
 *     summary: Cast a vote anonymously
 *     tags: [Voting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choice
 *               - zkProof
 *             properties:
 *               choice:
 *                 type: string
 *                 description: The voting choice/candidate
 *               zkProof:
 *                 type: object
 *                 description: The zero-knowledge proof for the vote
 *     responses:
 *       201:
 *         description: Vote cast successfully
 *       400:
 *         description: Bad request or already voted
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/cast', protect, voteController.castVote);

/**
 * @swagger
 * /api/vote/stats:
 *   get:
 *     summary: Get voting statistics (admin only)
 *     tags: [Voting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Voting statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin access required
 *       500:
 *         description: Server error
 */
router.get('/stats', protect, adminOnly, voteController.getVotingStats);

module.exports = router; 