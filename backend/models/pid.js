const mongoose = require('mongoose');

const pidSchema = new mongoose.Schema({
  pidName: {
    type: String,
    required: [true, 'PID Name is required']
  },
  pidId: {
    type: String,
    required: [true, 'PID ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required']
  }
});

// Debug middleware to log the document before saving
pidSchema.pre('save', function(next) {
  console.log('Document being saved:', {
    pidName: this.pidName,
    pidId: this.pidId,
    userId: this.userId,
    _id: this._id
  });
  next();
});

// Ensure proper JSON serialization
pidSchema.set('toJSON', {
  transform: function(doc, ret) {
    return {
      _id: ret._id,
      name: ret.pidName,
      pid: ret.pidId,
      userId: ret.userId
    };
  }
});

// Export the model
let PID;
try {
  // Try to get existing model
  PID = mongoose.model('PID');
} catch (error) {
  // Model doesn't exist, create new one
  PID = mongoose.model('PID', pidSchema);
}

module.exports = PID;
