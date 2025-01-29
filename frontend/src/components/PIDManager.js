// frontend/src/components/PIDManager.js
import React, { useState, useEffect, useRef } from 'react';

export default function PIDManager({
  pids,
  selectedPID,
  onPIDSelect,
  onPIDAdd,
  onPIDDelete,
  // NEW PROPS from MainPage:
  handleSyncFromGoodData,
  syncStatus,
  renderSyncButtonText
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPIDName, setNewPIDName] = useState('');
  const [newPIDValue, setNewPIDValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler for creating a new PID
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPIDName.trim() || !newPIDValue.trim()) {
      alert('Both Project Name and PID are required');
      return;
    }
    onPIDAdd({ name: newPIDName.trim(), pid: newPIDValue.trim() });
    setNewPIDName('');
    setNewPIDValue('');
    setShowAddForm(false);
  };

  return (
    <div style={{
      marginBottom: '20px',
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    }}>
      {/* PID dropdown */}
      <div ref={dropdownRef} style={{ 
        width: '600px',
        position: 'relative'
      }}>
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
            boxSizing: 'border-box'
          }}
        >
          <span>
            {selectedPID && selectedPID.name
              ? `${selectedPID.name} (${selectedPID.pid})`
              : "Select Project"}
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
            border: '3px solid black',
            borderRadius: '4px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            {Array.isArray(pids) && pids.map((pid, index) => (
              <div
                key={pid._id}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: index === pids.length - 1 ? 'none' : '1px solid #eee',
                  backgroundColor: 'white'
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
                    onPIDSelect(pid);
                    setShowDropdown(false);
                  }}
                  style={{ flex: 1, padding: '0 8px' }}
                >
                  {pid.name ? `${pid.name} (${pid.pid})` : 'Unnamed PID'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${pid.name}"?`)) {
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
                  Del
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* "Add PID" & "Sync from GoodData" side by side */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FFC480',
            color: 'black',
            border: '3px solid black',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '120px',
            height: '40px'
          }}
        >
          Add PID
        </button>

        <button
          onClick={handleSyncFromGoodData}
          disabled={syncStatus === 'syncing' || !selectedPID}
          style={{
            padding: '8px 16px',
            backgroundColor: syncStatus === 'syncing' ? 'gray' : 'lightgreen',
            color: 'black',
            border: '3px solid black',
            borderRadius: '4px',
            cursor: selectedPID ? 'pointer' : 'not-allowed',
            width: '180px',
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {renderSyncButtonText()}
        </button>
      </div>

      {/* "Add PID" Form Modal */}
      {showAddForm && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          zIndex: 1001,
          width: '300px',
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
