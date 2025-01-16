import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Component for creating and editing variables associated with a PID
// Props:
// - onVariableAdded: Callback function when a variable is added/updated
// - selectedPID: Currently selected PID object
// - initialData: Data for editing existing variable
// - isEditing: Boolean flag for edit mode
// - submitButtonText: Custom text for submit button
// - onCancel: Callback function when cancel button is clicked
function VariableForm({ onVariableAdded, selectedPID, initialData, isEditing, submitButtonText, onCancel }) {
  // State management for form fields and UI
  const [name, setName] = useState(initialData?.name || '');
  const [value, setValue] = useState(initialData?.value || '');
  const [type, setType] = useState(initialData?.type || 'Metric');
  const [elementId, setElementId] = useState(initialData?.elementId || '');
  const [error, setError] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Available options for variable type selection
  const typeOptions = ["Metric", "Attribute", "Attribute Value"];

  // Update form fields when initialData changes (editing mode)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setValue(initialData.value);
      setType(initialData.type);
      setElementId(initialData.elementId);
    }
  }, [initialData]);

  // Handle form submission for creating/updating variables
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate PID selection
    if (!selectedPID?._id) {
      setError('Please select a PID first');
      return;
    }

    try {
      // Construct API endpoint based on create/edit mode
      const token = localStorage.getItem('token');
      const url = `${process.env.REACT_APP_API_URL}/variables/${selectedPID._id}${
        isEditing ? `/${initialData._id}` : ''
      }`;
      
      const method = isEditing ? 'put' : 'post';
      
      // Send request to create/update variable
      const response = await axios[method](
        url,
        { name, value, type, elementId: type === 'Attribute Value' ? elementId : 'NA' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset form fields after successful creation
      if (!isEditing) {
        // Clear form only if creating new variable
        setName('');
        setValue('');
        setType('Metric');
        setElementId('');
      }
      
      // Notify parent component of successful operation
      if (onVariableAdded) {
        onVariableAdded(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Error ${isEditing ? 'updating' : 'adding'} variable`);
    }
  };

  return (
    // Main container with styled border and background
    <div style={{ 
      border: '3px solid black',
      borderRadius: '12px',
      padding: '15px',
      backgroundColor: '#FFF4DA',
      height: '300px',
      boxShadow: '5px 5px 10px rgb(0, 0, 0)'
    }}>
      {/* Header section showing form mode (Add/Edit) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>
        <span style={{ fontWeight: '500' }}>
          {isEditing ? 'Edit Variable' : 'Add New Variable'}
        </span>
      </div>

      {/* Error message display */}
      {error && <div style={{ color: 'red', marginBottom: 10, fontSize: '14px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {/* Variable name input field */}
        <div style={{ marginBottom: 10 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Variable Name"
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid black', 
              boxSizing: 'border-box',
              fontFamily: 'Roboto'
            }}
            required
          />
        </div>

        {/* Custom dropdown for variable type selection */}
        <div style={{ marginBottom: 10, position: 'relative' }}>
          <div 
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid black',
              cursor: 'pointer',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'Roboto'
            }}
          >
            <span>{type}</span>
            <span>{showTypeDropdown ? '▲' : '▼'}</span>
          </div>
          
          {showTypeDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid black',
              borderRadius: '4px',
              marginTop: '4px',
              zIndex: 1000,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {typeOptions.map((option, index) => (
                <div
                  key={option}
                  onClick={() => {
                    setType(option);
                    setShowTypeDropdown(false);
                  }}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    borderBottom: index === typeOptions.length - 1 ? 'none' : '1px solid #eee',
                    backgroundColor: 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conditional Element ID input field for Attribute Value type */}
        {type === 'Attribute Value' && (
          <div style={{ marginBottom: 10 }}>
            <input
              type="text"
              value={elementId}
              onChange={(e) => setElementId(e.target.value)}
              placeholder="Element ID"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid black', boxSizing: 'border-box' }}
              required
            />
          </div>
        )}

        {/* Variable value input field */}
        <div style={{ marginBottom: 10 }}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid black', boxSizing: 'border-box' }}
            required
          />
        </div>

        {/* Submit button with dynamic text based on mode */}
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '8px',
            backgroundColor: '#FFC480',
            color: 'black',
            border: '3px solid black',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          {submitButtonText}
        </button>

        {/* Cancel button */}
        <button 
          type="button"
          onClick={onCancel}
          style={{ 
            width: '100%', 
            padding: '8px',
            backgroundColor: '#FFFFFF',
            color: 'black',
            border: '3px solid black',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default VariableForm;
