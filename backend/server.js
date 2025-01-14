require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const corsConfig = require('./config/cors');

const authRoutes = require('./routes/auth');
const variableRoutes = require('./routes/variables');
const pidRoutes = require('./routes/PIDSroute');
const configRoutes = require('./routes/config');
const metricsRouter = require('./routes/metrics');
const API_URL = process.env.REACT_APP_API_URL;

const app = express();

// Apply CORS middleware with configuration
app.use(cors(corsConfig));

// Add OPTIONS handling for preflight requests
app.options('*', cors(corsConfig));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
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

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/variables', variableRoutes);
app.use('/pids', pidRoutes);
app.use('/config', configRoutes);
app.use('/metrics', metricsRouter);

// Add debug route to check CORS
app.options('/debug-cors', cors());
app.get('/debug-cors', (req, res) => {
  res.json({
    headers: req.headers,
    corsConfig: {
      origin: req.headers.origin,
      method: req.method
    }
  });
});

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
