const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  // Unique identifier for the candidate
  candidateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Name of the candidate
  name: {
    type: String,
    required: true
  },
  // Description or policy focus
  description: {
    type: String,
    required: true
  },
  // Whether the candidate is active in elections
  isActive: {
    type: Boolean,
    default: true
  },
  // Modification proof - stores hash of the admin proof
  // that was used to add/modify this candidate
  modificationProof: {
    type: String,
    required: true
  },
  // Timestamp of when the candidate was created
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Timestamp of last modification
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
CandidateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Candidate = mongoose.model('Candidate', CandidateSchema);

module.exports = Candidate; 