const express = require('express');
const candidateController = require('../controllers/candidateController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all active candidates
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of active candidates
 *       500:
 *         description: Server error
 */
router.get('/', candidateController.getCandidates);

/**
 * @swagger
 * /api/candidates/admin:
 *   get:
 *     summary: Get all candidates (including inactive) - Admin only
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all candidates
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin
 *       500:
 *         description: Server error
 */
router.get('/admin', protect, adminOnly, candidateController.getAllCandidatesAdmin);

/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Add a new candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - zkProof
 *             properties:
 *               name:
 *                 type: string
 *                 description: Candidate name
 *               description:
 *                 type: string
 *                 description: Candidate description or policy focus
 *               zkProof:
 *                 type: object
 *                 description: Zero-knowledge proof for admin action
 *     responses:
 *       201:
 *         description: Candidate created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin
 *       500:
 *         description: Server error
 */
router.post('/', protect, adminOnly, candidateController.addCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update a candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - zkProof
 *             properties:
 *               name:
 *                 type: string
 *                 description: Candidate name
 *               description:
 *                 type: string
 *                 description: Candidate description or policy focus
 *               isActive:
 *                 type: boolean
 *                 description: Whether the candidate is active
 *               zkProof:
 *                 type: object
 *                 description: Zero-knowledge proof for admin action
 *     responses:
 *       200:
 *         description: Candidate updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, adminOnly, candidateController.updateCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete a candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - zkProof
 *             properties:
 *               zkProof:
 *                 type: object
 *                 description: Zero-knowledge proof for admin action
 *     responses:
 *       200:
 *         description: Candidate deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, adminOnly, candidateController.deleteCandidate);

module.exports = router; 