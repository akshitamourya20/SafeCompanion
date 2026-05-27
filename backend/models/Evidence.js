const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  audioLength: {
    type: String,
    default: '0:15'
  },
  transcript: {
    type: String,
    required: true
  },
  encryptedHash: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Evidence', EvidenceSchema);
