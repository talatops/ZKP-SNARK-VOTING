const Candidate = require('../models/Candidate');
const User = require('../models/User');
const logger = require('../utils/logger');
const { logSystemEvent } = logger;
const { generateAdminActionProof, verifyAdminActionProof } = require('../services/zkpService');
const crypto = require('crypto');

/**
 * Get all active candidates
 * @route GET /api/candidates
 * @access Public
 */
exports.getCandidates = async (req, res, next) => {
  try {
    // Get all active candidates only
    const candidates = await Candidate.find({ isActive: true })
      .select('candidateId name description isActive')
      .sort('name');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all candidates for admin
 * @route GET /api/candidates/admin
 * @access Admin only
 */
exports.getAllCandidatesAdmin = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Get all candidates including inactive ones
    const candidates = await Candidate.find({})
      .select('candidateId name description isActive')
      .sort('name');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new candidate
 * @route POST /api/candidates
 * @access Admin only
 */
exports.addCandidate = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { name, description, isActive, zkProof } = req.body;

    if (!name || !description || !zkProof) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and ZK proof'
      });
    }

    // Verify the ZK proof for this admin action
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Generate a unique candidate ID
    const candidateId = `candidate-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create action data for verification
    const actionData = {
      action: 'add',
      candidateId,
      name,
      description,
      isActive
    };

    // Verify the admin proof
    const expectedAdminProof = adminUser.hashedIdentifier;
    const isValidProof = await verifyAdminActionProof(zkProof, expectedAdminProof);

    if (!isValidProof) {
      await logSystemEvent('ERROR', 'Candidate addition failed', 'Invalid admin proof');
      return res.status(400).json({
        success: false,
        message: 'Invalid ZK proof for admin action'
      });
    }

    // Extract actionHash from the proof
    const actionHash = zkProof.publicSignals[1];

    // Create the candidate with isActive status from request (default to true if not specified)
    const candidate = await Candidate.create({
      candidateId,
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
      modificationProof: actionHash
    });

    await logSystemEvent('INFO', 'Candidate added', `Admin added candidate: ${name}`);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    await logSystemEvent('ERROR', 'Candidate addition error', error.message);
    next(error);
  }
};

/**
 * Update a candidate
 * @route PUT /api/candidates/:id
 * @access Admin only
 */
exports.updateCandidate = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { name, description, isActive, zkProof } = req.body;
    const { id } = req.params;

    // Find the candidate
    const candidate = await Candidate.findOne({ candidateId: id });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Verify the ZK proof for this admin action
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Create action data for verification
    const actionData = {
      action: 'update',
      candidateId: id,
      name: name || candidate.name,
      description: description || candidate.description,
      isActive: isActive !== undefined ? isActive : candidate.isActive
    };

    // Verify the admin proof
    const expectedAdminProof = adminUser.hashedIdentifier;
    const isValidProof = await verifyAdminActionProof(zkProof, expectedAdminProof);

    if (!isValidProof) {
      await logSystemEvent('ERROR', 'Candidate update failed', 'Invalid admin proof');
      return res.status(400).json({
        success: false,
        message: 'Invalid ZK proof for admin action'
      });
    }

    // Extract actionHash from the proof
    const actionHash = zkProof.publicSignals[1];

    // Update the candidate
    if (name) candidate.name = name;
    if (description) candidate.description = description;
    if (isActive !== undefined) candidate.isActive = isActive;
    
    // Update the modification proof
    candidate.modificationProof = actionHash;

    await candidate.save();

    await logSystemEvent('INFO', 'Candidate updated', `Admin updated candidate: ${candidate.name}`);

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    await logSystemEvent('ERROR', 'Candidate update error', error.message);
    next(error);
  }
};

/**
 * Delete a candidate (soft delete by setting isActive to false)
 * @route DELETE /api/candidates/:id
 * @access Admin only
 */
exports.deleteCandidate = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { zkProof } = req.body;
    const { id } = req.params;

    // Find the candidate
    const candidate = await Candidate.findOne({ candidateId: id });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Verify the ZK proof for this admin action
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Create action data for verification
    const actionData = {
      action: 'delete',
      candidateId: id
    };

    // Verify the admin proof
    const expectedAdminProof = adminUser.hashedIdentifier;
    const isValidProof = await verifyAdminActionProof(zkProof, expectedAdminProof);

    if (!isValidProof) {
      await logSystemEvent('ERROR', 'Candidate deletion failed', 'Invalid admin proof');
      return res.status(400).json({
        success: false,
        message: 'Invalid ZK proof for admin action'
      });
    }

    // Extract actionHash from the proof
    const actionHash = zkProof.publicSignals[1];

    // Soft delete by setting isActive to false
    candidate.isActive = false;
    candidate.modificationProof = actionHash;
    await candidate.save();

    await logSystemEvent('INFO', 'Candidate deleted', `Admin soft-deleted candidate: ${candidate.name}`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    await logSystemEvent('ERROR', 'Candidate deletion error', error.message);
    next(error);
  }
}; 