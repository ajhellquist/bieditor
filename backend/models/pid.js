const mongoose = require('mongoose');

const PIDSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pidName: String,
  pidId: String
});

module.exports = mongoose.model('PID', PIDSchema);
