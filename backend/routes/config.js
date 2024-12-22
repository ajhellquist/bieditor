const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user.libraryConfig);
  } catch {
    res.status(500).json({ msg: 'Error fetching config' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { metrics, attributes, values } = req.body;
    const user = await User.findById(req.userId);
    user.libraryConfig = { metrics, attributes, values };
    await user.save();
    res.json(user.libraryConfig);
  } catch {
    res.status(500).json({ msg: 'Error updating config' });
  }
});

module.exports = router;
