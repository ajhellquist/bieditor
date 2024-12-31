const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');
const auth = require('../middleware/auth');

// Get count of copy actions for the authenticated user
router.get('/copy-count', auth, async (req, res) => {
  try {
    console.log('Fetching metrics for user:', req.user._id);
    if (!req.user._id) {
      throw new Error('User ID is undefined');
    }
    
    const count = await Metric.countDocuments({
      userId: req.user._id,
      type: 'copy'
    });
    console.log('Found metrics count:', count);
    res.json({ count });
  } catch (error) {
    console.error('Detailed error in /copy-count:', {
      error: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({ 
      message: 'Error fetching metrics',
      error: error.message 
    });
  }
});

// Create a new metric
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new metric for user:', req.user);
    if (!req.user || !req.user._id) {
      throw new Error('User ID is undefined');
    }

    const metric = new Metric({
      userId: req.user._id,
      type: 'copy'
    });
    
    console.log('About to save metric:', metric);
    await metric.save();
    console.log('Metric saved successfully');
    
    res.status(201).json(metric);
  } catch (error) {
    console.error('Detailed error in creating metric:', {
      error: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({ 
      message: 'Error creating metric',
      error: error.message 
    });
  }
});

module.exports = router; 