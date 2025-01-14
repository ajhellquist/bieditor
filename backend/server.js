require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const variableRoutes = require('./routes/variables');
const pidRoutes = require('./routes/pids');
const configRoutes = require('./routes/config');
const metricsRouter = require('./routes/metrics');

const app = express();

// Place this before any other middleware or route handlers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://bieditor-git-main-ajhellquists-projects.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Then your other middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
  });

// Mount routes
app.use('/auth', authRoutes);
app.use('/variables', variableRoutes);
app.use('/pids', pidRoutes);
app.use('/config', configRoutes);
app.use('/metrics', metricsRouter);

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

console.log('Current directory:', __dirname);
console.log('Files in models:', fs.readdirSync(path.join(__dirname, 'models')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
