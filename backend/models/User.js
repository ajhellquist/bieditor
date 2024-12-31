const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  libraryConfig: {
    metrics: { type: String, default: '' },
    attributes: { type: String, default: '' },
    values: { type: String, default: '' }
  }
});

module.exports = mongoose.model('User', UserSchema);
