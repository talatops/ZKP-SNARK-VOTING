const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(adminOnly);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get system logs with filtering and pagination (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of logs per page
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [INFO, WARN, ERROR]
 *         description: Filter by log level
 *       - in: query
 *         name: timeFrame
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *         description: Filter by time frame
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin access required
 *       500:
 *         description: Server error
 */
router.get('/logs', adminController.getSystemLogs);

/**
 * @swagger
 * /api/admin/system-status:
 *   get:
 *     summary: Get system status information (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin access required
 *       500:
 *         description: Server error
 */
router.get('/system-status', adminController.getSystemStatus);

module.exports = router; 