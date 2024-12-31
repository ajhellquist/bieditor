const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      email, 
      password: hashed,
      firstName,
      lastName
    });
    await newUser.save();
    
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ msg: 'Error creating user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Login error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    console.log('Fetching user with ID:', req.user.userId);
    const user = await User.findById(req.user.userId);
    console.log('Found user:', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    };
    console.log('Sending user data:', userData);
    res.json(userData);
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ message: 'Error fetching user info', error: error.message });
  }
});

module.exports = router;
