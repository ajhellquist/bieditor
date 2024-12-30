import React, { useState, useEffect } from 'react';

export default function PIDManager({ pids, onPIDSelect, onPIDAdd, onPIDDelete, selectedPID }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPIDName, setNewPIDName] = useState('');
  const [newPIDValue, setNewPIDValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    console.log('PIDManager - Current pids:', JSON.stringify(pids, null, 2));
    console.log('PIDManager - Selected PID:', JSON.stringify(selectedPID, null, 2));
  }, [pids, selectedPID]);

  const handleSubmit = (e) => {
    e.preventDefault();
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
    
    setNewPIDName('');
    setNewPIDValue('');
    setShowAddForm(false);
  };

  return (
    <div style={{ 
      marginBottom: '20px',
      display: 'flex',
      gap: '20px',
      alignItems: 'flex-start'
    }}>
      <div style={{ 
        width: '1000px',
        position: 'relative' 
      }}>
        <div 
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            fontFamily: 'Times New Roman'
          }}
        >
          <span>
            {selectedPID && selectedPID.name ? 
              `${selectedPID.name} (${selectedPID.pid})` : 
              "Select Project"
            }
          </span>
          <span>{showDropdown ? '▲' : '▼'}</span>
        </div>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {Array.isArray(pids) && pids.map((pid, index) => {
              console.log('Rendering PID item:', pid);
              return (
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

      <button
        onClick={() => setShowAddForm(true)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#28A745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '200px',
          height: '35px'
        }}
      >
        Add PID
      </button>

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