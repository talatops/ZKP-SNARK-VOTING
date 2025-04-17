const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Note: we never log personal identifiable information
  // Only technical details for system monitoring
});

const SystemLog = mongoose.model('SystemLog', SystemLogSchema);

module.exports = SystemLog; 