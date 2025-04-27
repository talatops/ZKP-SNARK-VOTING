const User = require('../models/User');
const Vote = require('../models/Vote');
const SystemLog = require('../models/SystemLog');
const logger = require('../utils/logger');
const { logSystemEvent } = logger;
const zkpService = require('../services/zkpService');
const blockchainService = require('../services/blockchainService');

// Cast a vote
exports.castVote = async (req, res, next) => {
  try {
    const { choice, zkProof } = req.body;
    const { nullifierHash } = req.user; // From JWT token

    if (!choice || !zkProof) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both choice and zkProof'
      });
    }

    // Check if nullifier has already been used (prevent double voting)
    const existingVote = await Vote.findOne({ nullifierHash });
    if (existingVote) {
      await logSystemEvent('WARN', 'Double voting attempt', 'Nullifier hash already used');
      return res.status(400).json({
        success: false,
        message: 'You have already voted'
      });
    }

    // Verify the zk-SNARK proof for the vote
    const isProofValid = await zkpService.verifyVoteProof(zkProof, nullifierHash, choice);
    if (!isProofValid) {
      await logSystemEvent('WARN', 'Invalid vote proof', 'ZK proof verification failed');
      return res.status(400).json({
        success: false,
        message: 'Invalid proof'
      });
    }

    // Submit vote to blockchain
    let transactionHash = null;
    try {
      transactionHash = await blockchainService.submitVote(nullifierHash, choice, zkProof);
    } catch (error) {
      logger.error(`Blockchain submission failed: ${error.message}`);
      // Continue with local vote recording even if blockchain submission fails
    }

    // Record the vote in the database
    const vote = await Vote.create({
      nullifierHash,
      choice,
      proof: JSON.stringify(zkProof),
      transactionHash
    });

    // Update user's voting status
    await User.findOneAndUpdate(
      { nullifierHash },
      { hasVoted: true }
    );

    await logSystemEvent('INFO', 'Vote cast successfully', 'Vote recorded anonymously');

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      transactionHash
    });
  } catch (error) {
    next(error);
  }
};

// Get voting statistics (for admin dashboard)
exports.getVotingStats = async (req, res, next) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Count votes for each choice
    const voteCounts = await Vote.aggregate([
      { $group: { _id: '$choice', count: { $sum: 1 } } }
    ]);

    const totalVotes = await Vote.countDocuments();
    const registeredVoters = await User.countDocuments({ isAdmin: false });
    const votingRate = registeredVoters > 0 ? (totalVotes / registeredVoters) * 100 : 0;

    await logSystemEvent('INFO', 'Voting statistics accessed', 'Admin viewed voting statistics');

    res.status(200).json({
      success: true,
      data: {
        totalVotes,
        registeredVoters,
        votingRate: Math.round(votingRate * 100) / 100, // Round to 2 decimal places
        voteCounts: voteCounts.map(item => ({
          choice: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}; 