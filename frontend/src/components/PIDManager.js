// Component for managing Project IDs (PIDs), including selection, addition, and deletion
import React, { useState, useEffect } from 'react';

export default function PIDManager({ pids, onPIDSelect, onPIDAdd, onPIDDelete, selectedPID }) {
  // State management for component
  const [showAddForm, setShowAddForm] = useState(false);     // Controls visibility of the Add PID form
  const [newPIDName, setNewPIDName] = useState('');         // Stores new project name input
  const [newPIDValue, setNewPIDValue] = useState('');       // Stores new PID input
  const [showDropdown, setShowDropdown] = useState(false);  // Controls visibility of PID selection dropdown

  // Debug logging for PID updates and selection changes
  useEffect(() => {
    console.log('PIDManager - Current pids:', JSON.stringify(pids, null, 2));
    console.log('PIDManager - Selected PID:', JSON.stringify(selectedPID, null, 2));
  }, [pids, selectedPID]);

  // Handles the submission of new PID entries
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate that both fields are filled
    if (!newPIDName.trim() || !newPIDValue.trim()) {
      alert('Both Project Name and PID are required');
      return;
    }
    
    const newPID = {
      name: newPIDName.trim(),
      pid: newPIDValue.trim()
    };
    
    console.log('PIDManager - Submitting new PID:', newPID);
    onPIDAdd(newPID);
    
    // Reset form state after submission
    setNewPIDName('');
    setNewPIDValue('');
    setShowAddForm(false);
  };

  return (
    // Main container for PID management interface
    <div style={{ 
      marginBottom: '20px',
      display: 'flex',
      gap: '20px',
      alignItems: 'flex-start'
    }}>
      {/* PID Selection Dropdown Container */}
      <div style={{ 
        width: '1000px',
        position: 'relative' 
      }}>
        {/* Dropdown Toggle Button */}
        <div 
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '3px solid black',
            cursor: 'pointer',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            fontFamily: 'Roboto'
          }}
        >
          {/* Display selected PID or default text */}
          <span>
            {selectedPID && selectedPID.name ? 
              `${selectedPID.name} (${selectedPID.pid})` : 
              "Select Project"
            }
          </span>
          {/* Dropdown arrow indicator */}
          <span>{showDropdown ? '▲' : '▼'}</span>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '3px solid black',
            borderRadius: '4px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {/* Map through available PIDs */}
            {Array.isArray(pids) && pids.map((pid, index) => {
              console.log('Rendering PID item:', pid);
              return (
                // Individual PID list item
                <div
                  key={pid._id}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index === pids.length - 1 ? 'none' : '1px solid #eee',
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
                  {/* PID Selection Area */}
                  <span
                    onClick={() => {
                      console.log('Selected PID:', pid);
                      onPIDSelect(pid);
                      setShowDropdown(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0 8px'
                    }}
                  >
                    {pid.name ? `${pid.name} (${pid.pid})` : 'Unnamed PID'}
                  </span>
                  {/* Delete PID Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${pid.name || 'this PID'}"?`)) {
                        onPIDDelete(pid._id);
                      }
                    }}
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New PID Button */}
      <button
        onClick={() => setShowAddForm(true)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#FFC480',
          color: 'black',
          border: '3px solid black',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '200px',
          height: '40px',
          marginLeft: '10px' 
        }}
      >
        Add PID
      </button>

      {/* Add PID Form Modal */}
      {showAddForm && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          zIndex: 1001,
          width: '400px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Project Name Input Field */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Project Name:
              </label>
              <input
                type="text"
                value={newPIDName}
                onChange={(e) => setNewPIDName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            {/* PID Input Field */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                PID:
              </label>
              <input
                type="text"
                value={newPIDValue}
                onChange={(e) => setNewPIDValue(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            {/* Form Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 