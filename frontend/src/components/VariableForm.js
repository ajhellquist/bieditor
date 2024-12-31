import React, { useState, useEffect } from 'react';
import axios from 'axios';

function VariableForm({ onVariableAdded, selectedPID, initialData, isEditing, submitButtonText }) {
  const [name, setName] = useState(initialData?.name || '');
  const [value, setValue] = useState(initialData?.value || '');
  const [type, setType] = useState(initialData?.type || 'Metric');
  const [elementId, setElementId] = useState(initialData?.elementId || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setValue(initialData.value);
      setType(initialData.type);
      setElementId(initialData.elementId);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPID?._id) {
      setError('Please select a PID first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:4000/variables/${selectedPID._id}${
        isEditing ? `/${initialData._id}` : ''
      }`;
      
      const method = isEditing ? 'put' : 'post';
      
      const response = await axios[method](
        url,
        { name, value, type, elementId: type === 'Attribute Value' ? elementId : 'NA' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!isEditing) {
        // Clear form only if creating new variable
        setName('');
        setValue('');
        setType('Metric');
        setElementId('');
      }
      
      if (onVariableAdded) {
        onVariableAdded(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Error ${isEditing ? 'updating' : 'adding'} variable`);
    }
  };

  return (
    <div style={{ 
      border: '3px solid black',
      borderRadius: '12px',
      padding: '15px',
      backgroundColor: '#FFF4DA',
      height: '300px',
      boxShadow: '5px 5px 10px rgb(0, 0, 0)'
    }}>
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

      {error && <div style={{ color: 'red', marginBottom: 10, fontSize: '14px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
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
        <div style={{ marginBottom: 10 }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid black', boxSizing: 'border-box' }}
            required
          >
            <option value="Metric">Metric</option>
            <option value="Attribute">Attribute</option>
            <option value="Attribute Value">Attribute Value</option>
          </select>
        </div>
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
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '8px',
            backgroundColor: '#FFC480',
            color: 'black',
            border: '3px solid black',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {submitButtonText || (isEditing ? 'Save' : 'Add Variable')}
        </button>
      </form>
    </div>
  );
}

export default VariableForm;
