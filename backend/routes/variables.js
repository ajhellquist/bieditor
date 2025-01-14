const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Variable = require('../models/Variable');
const PID = require('../models/PID');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// Move this route to the top, before other routes that use :pidId
router.delete('/all/:pidId', auth, async (req, res) => {
  try {
    // First verify the PID belongs to the user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    // Delete all variables for this PID
    await Variable.deleteMany({ pidId: req.params.pidId });
    res.json({ message: 'All variables deleted' });
  } catch (err) {
    console.error('Error deleting variables:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get variables for a specific PID
router.get('/:pidId', auth, async (req, res) => {
  try {
    // First verify the PID belongs to the user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    const variables = await Variable.find({ pidId: req.params.pidId });
    res.json(variables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new variable for a specific PID
router.post('/:pidId', auth, async (req, res) => {
  try {
    const { name, value, type, elementId } = req.body;
    
    // Verify PID belongs to user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    const variable = new Variable({
      pidId: req.params.pidId,
      name,
      value,
      type,
      elementId: type === 'Attribute Value' ? elementId : 'NA'
    });

    const savedVariable = await variable.save();
    res.status(201).json(savedVariable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete variable
router.delete('/:pidId/:variableId', auth, async (req, res) => {
  try {
    // Verify PID belongs to user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    const variable = await Variable.findOneAndDelete({
      _id: req.params.variableId,
      pidId: req.params.pidId
    });

    if (!variable) {
      return res.status(404).json({ message: 'Variable not found' });
    }

    res.json({ message: 'Variable deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update variable
router.put('/:pidId/:variableId', auth, async (req, res) => {
  try {
    // Verify PID belongs to user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    const { name, value, type, elementId } = req.body;
    
    const variable = await Variable.findOneAndUpdate(
      { _id: req.params.variableId, pidId: req.params.pidId },
      { 
        name, 
        value, 
        type,
        elementId: type === 'Attribute Value' ? elementId : 'NA'
      },
      { new: true }
    );

    if (!variable) {
      return res.status(404).json({ message: 'Variable not found' });
    }

    res.json(variable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:pid/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('File upload request received');
    console.log('Headers:', req.headers);
    console.log('File:', req.file);
    
    // Your existing upload logic...
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
