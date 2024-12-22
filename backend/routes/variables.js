const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Variable = require('../models/Variable');

// Middleware to check JWT
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
}

router.post('/', auth, async (req, res) => {
  try {
    const { name, value, type } = req.body;
    console.log('Creating variable:', { name, value, type });

    const variable = new Variable({ 
      userId: req.userId, 
      name, 
      value,
      type
    });
    
    await variable.save();
    console.log('Saved variable:', variable);
    res.json(variable);
  } catch (err) {
    console.error('Error creating variable:', err);
    res.status(500).json({ msg: 'Failed to create variable' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const variables = await Variable.find({ userId: req.userId });
    console.log('Fetched variables:', variables);
    res.json(variables);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch variables' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete request received:', {
      id: req.params.id,
      userId: req.userId
    });

    const variable = await Variable.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });

    if (!variable) {
      console.log('Variable not found:', {
        id: req.params.id,
        userId: req.userId
      });
      return res.status(404).json({ 
        msg: 'Variable not found',
        details: 'No variable found with the specified ID for this user'
      });
    }

    await Variable.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    console.log('Variable deleted successfully:', req.params.id);
    res.json({ 
      msg: 'Variable deleted',
      id: req.params.id 
    });
  } catch (err) {
    console.error('Error in delete route:', err);
    res.status(500).json({ 
      msg: 'Error deleting variable',
      error: err.message 
    });
  }
});

module.exports = router;
