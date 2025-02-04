import React, { useState } from 'react';
import axios from 'axios';

// Import environment variables
const API_URL = process.env.REACT_APP_API_URL;

/**
 * CSVUploader Component
 * Handles the upload, download, and deletion of variables via CSV files
 * 
 * @param {Object} selectedPID - Currently selected Process ID object
 * @param {Function} onVariablesAdded - Callback function to update parent component when variables change
 */
function CSVUploader({ selectedPID, onVariablesAdded }) {
  // State management for file handling and UI feedback
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles file selection and validates CSV file type
   * @param {Event} e - File input change event
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'text/csv') {
      setError('Please select a CSV file');
      setFile(null);
    } else {
      // Clean the CSV data before setting the file
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvContent = event.target.result;
        // Split into lines and process
        const lines = csvContent.split('\n');
        const header = lines[0];
        // Process all lines after header
        const cleanedLines = lines.slice(1).map(line => {
          const columns = line.split(',');
          if (columns.length >= 4 && columns[1].trim() === 'Attribute Value') {
            // Trim whitespace from elementId for attribute values
            columns[3] = columns[3].trim();
          }
          return columns.join(',');
        });
        
        // Reconstruct CSV with cleaned data
        const cleanedCSV = [header, ...cleanedLines].join('\n');
        const cleanedFile = new File([cleanedCSV], selectedFile.name, { type: 'text/csv' });
        setFile(cleanedFile);
      };
      reader.readAsText(selectedFile);
      setError('');
    }
  };

  /**
   * Generates and downloads a CSV template file with example data
   * Format: name, type, value, elementId
   */
  const downloadTemplate = () => {
    // Create CSV content
    const csvContent =
      'name,type,value,elementId\nExample Metric,Metric,10,NA\nExample Attribute,Attribute,value,NA\nExample Attribute Value,Attribute Value,value,element123';

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'variables_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Handles CSV file upload to the server
   * Validates PID selection and file presence before upload
   * @param {Event} e - Form submission event
   */
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedPID?._id) {
      setError('Please select a PID first');
      return;
    }

    if (!file) {
      setError('Please select a file');
      return;
    }

    // Add file size check
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit. Please split into smaller files.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    const url = `${process.env.REACT_APP_API_URL}/variables/${selectedPID._id}/upload`;
    
    try {
      const response = await axios({
        method: 'POST',
        url: url,
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout and max content length configs
        timeout: 300000, // 5 minute timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        withCredentials: false
      });

      // Check if we have a message about skipped duplicates
      if (response.data.message) {
        setError(response.data.message); // Using setError to display the info message
      }

      // Make sure we're passing the variables array to the callback
      if (onVariablesAdded && Array.isArray(response.data.variables)) {
        onVariablesAdded(response.data.variables);
      }

      setFile(null);
      e.target.reset();
    } catch (err) {
      console.error('Upload error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please try logging in again.');
      } else if (err.response?.status === 503) {
        setError('Server is busy. Please try uploading a smaller file or try again later.');
      } else {
        setError(`Upload failed: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes all variables associated with the selected PID
   * Requires user confirmation before deletion
   */
  const handleDeleteAll = async () => {
    if (!selectedPID?._id) {
      setError('Please select a PID first');
      return;
    }

    if (window.confirm('Are you sure you want to delete all variables for this PID? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios({
          method: 'DELETE',
          url: `${process.env.REACT_APP_API_URL}/variables/all/${selectedPID._id}`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        });

        console.log('Delete response:', response);

        // Update the parent component
        if (onVariablesAdded) {
          onVariablesAdded([]);
        }

        // Refresh the page
        window.location.reload();
      } catch (err) {
        console.error('Full error details:', err);
        setError(err.response?.data?.message || 'Error deleting variables');
      }
    }
  };

  /**
   * Render the CSV uploader interface
   * Includes file selection, upload button, template download, and delete all option
   */
  return (
    <div
      style={{
        border: '3px solid black',
        borderRadius: '12px',
        padding: '15px',
        backgroundColor: '#FFF4DA',
        height: '300px', // Reduced to match height of the other containers
        boxShadow: '5px 5px 10px rgb(0, 0, 0)',
      }}
    >
      {/* This parent div uses a 'gap' to uniformly space its children */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px', // Controls the vertical spacing
        }}
      >
        <span style={{ fontWeight: '500' }}>Upload Variables from CSV</span>

        <form
          onSubmit={handleUpload}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <label
            style={{
              display: 'inline-block',
              width: '100%',
              padding: '8px',
              backgroundColor: 'white',
              color: 'black',
              border: '3px solid black',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'center',
              boxSizing: 'border-box',
              fontFamily: 'Roboto',
            }}
          >
            {file ? file.name : 'Choose File'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {error && (
            <div
              style={{
                color: 'red',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: file ? '#FFC380' : '#cccccc',
              color: 'black',
              border: '3px solid black',
              borderRadius: '4px',
              cursor: file ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>

        <button
          onClick={downloadTemplate}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#EADBB7',
            color: 'black',
            border: '3px solid black',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Download Template
        </button>

        <button
          onClick={handleDeleteAll}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#ff4444',
            color: 'black',
            border: '3px solid black',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Delete All Variables
        </button>
      </div>
    </div>
  );
}

export default CSVUploader;
