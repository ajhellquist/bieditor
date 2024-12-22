// In many setups, you might store config in the User model.
// But here’s a separate schema if you want more flexibility.

const mongoose = require('mongoose');

const LibraryConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  library: { type: String, enum: ['metrics', 'attributes', 'values'] },
  format: String
});

module.exports = mongoose.model('LibraryConfig', LibraryConfigSchema);
