const express = require('express');
const authRoutes = require('./authRoutes');
const voteRoutes = require('./voteRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vote', voteRoutes);
router.use('/admin', adminRoutes);

module.exports = router; 