const mongoose = require('mongoose');

const variableSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Metric', 'Attribute', 'Attribute Value'],
    required: true,
    default: 'Metric'
  }
}, { timestamps: true });

module.exports = mongoose.model('Variable', variableSchema);
