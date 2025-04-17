const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // For voters, we only store the hash of their identifier
  hashedIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // For admins, we store username and password hash
  isAdmin: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    sparse: true,
    unique: true
  },
  passwordHash: {
    type: String
  },
  // To track if a user has voted
  hasVoted: {
    type: Boolean,
    default: false
  },
  // Store the public nullifier hash to prevent double voting
  nullifierHash: {
    type: String,
    sparse: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User; 