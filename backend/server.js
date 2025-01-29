// backend/server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const corsConfig = require('./config/cors');

const authRoutes = require('./routes/auth');
const variableRoutes = require('./routes/variables');
const pidRoutes = require('./routes/pids');
const configRoutes = require('./routes/config');
const metricsRouter = require('./routes/metrics');
// ---- ADD THIS: Require the GoodData routes ----
const goodDataRoutes = require('./routes/gooddata');

const API_URL = process.env.REACT_APP_API_URL;

const app = express();

// --------------------------------------------------------------------
// CORS Configuration
// --------------------------------------------------------------------
app.use(cors({
  origin: [
    'https://bieditor-git-main-ajhellquists-projects.vercel.app',
    'https://www.maqlexpress.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: true
}));

// Handle preflight requests
app.options('*', (req, res) => {
  const allowedOrigins = [
    'https://bieditor-git-main-ajhellquists-projects.vercel.app',
    'https://www.maqlexpress.com',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// --------------------------------------------------------------------
// Debug request-logging middleware
// --------------------------------------------------------------------
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', req.headers);
  next();
});

// --------------------------------------------------------------------
// Parse incoming JSON bodies
// --------------------------------------------------------------------
app.use(express.json());

// --------------------------------------------------------------------
// Connect to MongoDB
// --------------------------------------------------------------------
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// --------------------------------------------------------------------
// Handle Node.js process errors
// --------------------------------------------------------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// --------------------------------------------------------------------
// Mount All Routes
// --------------------------------------------------------------------
app.use('/auth', authRoutes);
app.use('/variables', variableRoutes);
app.use('/pids', pidRoutes);
app.use('/config', configRoutes);
app.use('/metrics', metricsRouter);

// ---- ADD THIS: Mount the GoodData sync route ----
app.use('/gooddata', goodDataRoutes);

// Optional debug route
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

// Basic health-check route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// --------------------------------------------------------------------
// Error Handler
// --------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// --------------------------------------------------------------------
// Debug logs for your folder structure
// --------------------------------------------------------------------
console.log('Current directory:', __dirname);
console.log('Files in models:', fs.readdirSync(path.join(__dirname, 'models')));

// --------------------------------------------------------------------
// Start the Server
// --------------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
