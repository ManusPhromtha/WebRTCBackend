const mongoose = require('mongoose');

const CallSessionSchema = new mongoose.Schema({
  roomId: String,
  participants: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('CallSession', CallSessionSchema);
