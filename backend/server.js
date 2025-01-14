require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const variableRoutes = require('./routes/variables');
const pidRoutes = require('./routes/pids');
const configRoutes = require('./routes/config');
const metricsRouter = require('./routes/metrics');

const app = express();

// Update CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://bieditor-ajhellquists-projects.vercel.app', 'https://your-custom-domain.com']
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
