import React, { useState } from 'react';
import axios from 'axios';

function VariableForm({ onVariableAdded, selectedPID }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState('Metric');
  const [elementId, setElementId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('Current selectedPID:', selectedPID);

    if (!selectedPID?._id) {
      setError('Please select a PID first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:4000/variables/${selectedPID._id}`,
        { 
          name, 
          value, 
          type,
          elementId: type === 'Attribute Value' ? elementId : 'NA'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Clear form
      setName('');
      setValue('');
      setType('Metric');
      setElementId('');
      
      if (onVariableAdded) {
        onVariableAdded(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding variable');
    }
  };

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Variable Name"
            style={{ width: '100%', padding: '5px' }}
            required
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', padding: '5px' }}
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
              style={{ width: '100%', padding: '5px' }}
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
            style={{ width: '100%', padding: '5px' }}
            required
          />
        </div>
        <button 
          type="submit"
          style={{ width: '100%', padding: '5px' }}
        >
          Add Variable
        </button>
      </form>
    </div>
  );
}

export default VariableForm;
