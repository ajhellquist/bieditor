import React, { useState } from 'react';
import axios from 'axios';

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
      setError('');
      setFile(selectedFile);
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

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const url = `https://bi-editor.herokuapp.com/variables/${selectedPID._id}/upload`;
    
    console.log('Attempting upload to:', url);
    console.log('Selected PID:', selectedPID);

    try {
      // Test CORS configuration
      console.log('Testing CORS configuration...');
      const corsTest = await axios.get(`${process.env.REACT_APP_API_URL}/debug-cors`);
      console.log('CORS Debug Response:', corsTest.data);

      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000, // 30 second timeout
      });

      if (onVariablesAdded) {
        onVariablesAdded(response.data);
      }

      setFile(null);
      e.target.reset();
    } catch (err) {
      console.error('Upload error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(`Upload failed: ${err.response?.data?.message || err.message}`);
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

    if (
      window.confirm(
        'Are you sure you want to delete all variables for this PID? This action cannot be undone.'
      )
    ) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/variables/${selectedPID._id}/upload`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update the parent component
        if (onVariablesAdded) {
          onVariablesAdded([]);
        }

        // Refresh the page
        window.location.reload();
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting variables');
        console.error('Delete error:', err);
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
