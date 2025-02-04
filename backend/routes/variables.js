const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Variable = require('../models/Variable');
const path = require('path');
const PID = require('../models/PIDmodel');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const upload = multer({ dest: 'uploads/' });

// Add CORS middleware specifically for this route
router.use((req, res, next) => {
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
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }
  next();
});

// Move this route to the top, before other routes that use :pidId
router.delete('/all/:pidId', auth, async (req, res) => {
  try {
    console.log('Delete request received for PID:', req.params.pidId);
    
    // First verify the PID belongs to the user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    // Delete all variables for this PID
    const result = await Variable.deleteMany({ pidId: req.params.pidId });
    console.log('Delete result:', result);
    
    res.json({ message: 'All variables deleted', count: result.deletedCount });
  } catch (err) {
    console.error('Error deleting variables:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get variables for a specific PID
router.get('/:pidId', auth, async (req, res) => {
  try {
    // First verify the PID belongs to the user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    const variables = await Variable.find({ pidId: req.params.pidId });
    res.json(variables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new variable for a specific PID
router.post('/:pidId', auth, async (req, res) => {
  try {
    const { name, value, type, elementId } = req.body;
    
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    // Check for existing variable with same name
    const existingVariable = await Variable.findOne({
      pidId: req.params.pidId,
      name: name
    });

    if (existingVariable) {
      return res.status(409).json({ 
        message: 'Variable with this name already exists',
        duplicate: true
      });
    }

    const variable = new Variable({
      pidId: req.params.pidId,
      name,
      value,
      type,
      elementId: type === 'Attribute Value' ? elementId : 'NA'
    });

    const savedVariable = await variable.save();
    res.status(201).json(savedVariable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete variable
router.delete('/:pidId/:variableId', auth, async (req, res) => {
  try {
    // Verify PID belongs to user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    const variable = await Variable.findOneAndDelete({
      _id: req.params.variableId,
      pidId: req.params.pidId
    });

    if (!variable) {
      return res.status(404).json({ message: 'Variable not found' });
    }

    res.json({ message: 'Variable deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update variable
router.put('/:pidId/:variableId', auth, async (req, res) => {
  try {
    // Verify PID belongs to user
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    const { name, value, type, elementId } = req.body;
    
    const variable = await Variable.findOneAndUpdate(
      { _id: req.params.variableId, pidId: req.params.pidId },
      { 
        name, 
        value, 
        type,
        elementId: type === 'Attribute Value' ? elementId : 'NA'
      },
      { new: true }
    );

    if (!variable) {
      return res.status(404).json({ message: 'Variable not found' });
    }

    res.json(variable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update the file upload route
router.post('/:pidId/upload', auth, upload.single('file'), async (req, res) => {
  // CORS handling from previous fix
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://bieditor-git-main-ajhellquists-projects.vercel.app',
    'https://www.maqlexpress.com',
    'http://localhost:3000'
  ];

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    // Verify PID belongs to user first
    const pid = await PID.findOne({
      _id: req.params.pidId,
      userId: req.user.userId
    });

    if (!pid) {
      return res.status(404).json({ message: 'PID not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get existing variables for this PID
    const existingVariables = await Variable.find({ pidId: req.params.pidId });
    const existingNames = new Set(existingVariables.map(v => v.name));
    
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    const variables = [];
    const skippedDuplicates = [];
    const BATCH_SIZE = 100; // Process 100 records at a time
    let batch = [];

    // Process records in batches
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const variableName = values[0].trim();
      
      // Check if variable with same name already exists
      if (existingNames.has(variableName)) {
        skippedDuplicates.push(variableName);
        continue;
      }

      const variable = {
        pidId: req.params.pidId,
        name: variableName,
        type: values[1],
        value: values[2],
        elementId: values[3] || 'NA'
      };

      batch.push(variable);

      // When batch is full or it's the last record, save the batch
      if (batch.length === BATCH_SIZE || i === lines.length - 1) {
        try {
          const savedVariables = await Variable.insertMany(batch, { ordered: false });
          variables.push(...savedVariables);
        } catch (error) {
          console.error('Batch insert error:', error);
          // Continue processing even if some records fail
        }
        batch = []; // Reset batch
      }
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    // Send response
    let message = variables.length > 0 ? 
      `Successfully added ${variables.length} variables.` : 
      'No new variables were added.';
    
    if (skippedDuplicates.length > 0) {
      message += ` Skipped ${skippedDuplicates.length} duplicate variables.`;
    }

    res.json({ 
      message, 
      variables,
      skippedCount: skippedDuplicates.length 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error processing upload',
      error: error.message 
    });
  }
});

module.exports = router;
