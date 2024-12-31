const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PID = require('../models/PID');
const mongoose = require('mongoose');

// Get all PIDs for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching PIDs for user:', req.user.userId);
    
    const pids = await PID.find({ 
      userId: new mongoose.Types.ObjectId(req.user.userId)
    });
    
    console.log('Found PIDs:', pids);
    
    const formattedPids = pids.map(pid => ({
      _id: pid._id,
      name: pid.pidName,
      pid: pid.pidId,
      userId: pid.userId
    }));

    res.json(formattedPids);
  } catch (error) {
    console.error('Error fetching PIDs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new PID
router.post('/', auth, async (req, res) => {
  try {
    const { name, pid } = req.body;
    
    console.log('Received PID creation request:', { name, pid });

    if (!name || !pid) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ 
        message: 'Name and PID are required',
        received: { name, pid }
      });
    }

    const pidData = {
      pidName: name.trim(),
      pidId: pid.trim(),
      userId: new mongoose.Types.ObjectId(req.user.userId)
    };

    console.log('Creating PID with data:', pidData);

    const pidDoc = new PID(pidData);

    // Validate the document before saving
    const validationError = pidDoc.validateSync();
    if (validationError) {
      console.log('Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation Error', 
        details: validationError.errors 
      });
    }

    const savedPID = await pidDoc.save();
    console.log('Successfully saved PID:', savedPID.toObject());

    const response = {
      _id: savedPID._id,
      name: savedPID.pidName,
      pid: savedPID.pidId,
      userId: savedPID.userId
    };

    console.log('Sending response:', response);
    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating PID:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error', 
        details: error.errors 
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete PID
router.delete('/:id', auth, async (req, res) => {
  try {
    const pid = await PID.findOne({ 
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    await PID.deleteOne({ _id: req.params.id });
    res.json({ message: 'PID deleted' });
  } catch (err) {
    console.error('Error deleting PID:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
