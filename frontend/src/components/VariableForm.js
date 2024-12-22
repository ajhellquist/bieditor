import React, { useState } from 'react';
import axios from 'axios';

function VariableForm({ onVariableAdded }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState('Metric');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:4000/variables', 
        { 
          name,
          value,
          type
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response from server:', response.data);
      
      // Clear form
      setName('');
      setValue('');
      setType('Metric');
      
      // Notify parent component
      if (onVariableAdded) {
        onVariableAdded(response.data);
      }
    } catch (err) {
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.msg || 'Error adding variable');
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
