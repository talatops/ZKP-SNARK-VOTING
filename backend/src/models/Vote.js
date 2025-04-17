const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  // We don't store the voter's identity, only the nullifier hash
  // This ensures votes are anonymous but prevents double voting
  nullifierHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // The choice that was made (candidates or options)
  choice: {
    type: String,
    required: true
  },
  // The zk proof that verified this vote
  proof: {
    type: String,
    required: true
  },
  // Timestamp of when the vote was cast
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Optional transaction hash if vote was recorded on blockchain
  transactionHash: {
    type: String,
    sparse: true,
    unique: true
  }
});

const Vote = mongoose.model('Vote', VoteSchema);

module.exports = Vote; 