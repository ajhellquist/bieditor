const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PID = require('../models/pid');
const mongoose = require('mongoose');

// Get all PIDs for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching PIDs for user:', req.user.id);
    
    const pids = await PID.find({ 
      userId: new mongoose.Types.ObjectId(req.user.id) 
    });
    
    console.log('Found PIDs:', pids);
    
    const formattedPids = pids.map(pid => ({
      _id: pid._id,
      name: pid.name,
      pid: pid.pid,
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
    
    console.log('Creating PID with data:', {
      name,
      pid,
      userId: req.user.id
    });

    // Validate input
    if (!name || !pid) {
      return res.status(400).json({
        message: 'Name and PID are required',
        received: { name, pid }
      });
    }

    // Create document
    const pidDoc = {
      name: name.trim(),
      pid: pid.trim(),
      userId: new mongoose.Types.ObjectId(req.user.id)
    };

    // Create and save the new PID
    const newPID = new PID(pidDoc);
    
    console.log('About to save PID document:', newPID);
    const savedPID = await newPID.save();
    console.log('Saved PID document:', savedPID);

    // Send response
    res.status(201).json({
      _id: savedPID._id,
      name: savedPID.name,
      pid: savedPID.pid,
      userId: savedPID.userId
    });

  } catch (error) {
    console.error('Error creating PID:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        details: error.message
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
      userId: req.user.id 
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
