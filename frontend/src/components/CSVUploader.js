import React, { useState } from 'react';
import axios from 'axios';

function CSVUploader({ selectedPID, onVariablesAdded }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const downloadTemplate = () => {
    // Create CSV content
    const csvContent = 'name,type,value,elementId\nExample Metric,Metric,10,NA\nExample Attribute,Attribute,value,NA\nExample Attribute Value,Attribute Value,value,element123';
    
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

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:4000/variables/${selectedPID._id}/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (onVariablesAdded) {
        onVariablesAdded(response.data);
      }
      
      // Reset file input
      setFile(null);
      // Reset file input element
      e.target.reset();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading variables');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      marginTop: '10px', 
      marginBottom: '20px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '15px',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '10px'
      }}>
        <span style={{ fontWeight: '500', marginBottom: '10px' }}>Upload Variables from CSV</span>
        
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ width: '100%' }}
            />
          </div>
          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={!file || loading}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: file ? '#4444ff' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: file ? 'pointer' : 'not-allowed',
              marginBottom: '10px'
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
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Download Template
        </button>
      </div>
    </div>
  );
}

export default CSVUploader; 