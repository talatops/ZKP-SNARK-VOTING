const express = require('express');
const authRoutes = require('./authRoutes');
const voteRoutes = require('./voteRoutes');
const adminRoutes = require('./adminRoutes');
const candidateRoutes = require('./candidateRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vote', voteRoutes);
router.use('/admin', adminRoutes);
router.use('/candidates', candidateRoutes);

module.exports = router; 