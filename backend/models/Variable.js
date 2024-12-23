const mongoose = require('mongoose');

const variableSchema = new mongoose.Schema({
  pidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PID',
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
  },
  elementId: {
    type: String,
    default: 'NA'
  }
}, { timestamps: true });

module.exports = mongoose.model('Variable', variableSchema);
