import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';
import VariableForm from '../components/VariableForm';
import PIDManager from '../components/PIDManager';

export default function MainPage() {
  const [code, setCode] = useState('// Start typing...');
  const [variables, setVariables] = useState([]);
  const [pids, setPids] = useState([]);
  const [selectedPID, setSelectedPID] = useState(null);

  useEffect(() => {
    fetchVariables();
    fetchPIDs();
  }, []);

  const fetchVariables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/variables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVariables(response.data);
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  };

  const fetchPIDs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching PIDs with token:', token);
      const response = await axios.get('http://localhost:4000/pids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched PIDs from server:', response.data);
      setPids(response.data);
    } catch (error) {
      console.error('Error fetching PIDs:', error);
    }
  };

  const handleVariableAdded = (newVariable) => {
    setVariables([...variables, newVariable]);
  };

  const handleDeleteVariable = async (variableId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Attempting to delete variable:', {
        id: variableId,
        url: `http://localhost:4000/variables/${variableId}`,
        token: token
      });
      
      const response = await axios.delete(
        `http://localhost:4000/variables/${variableId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Delete response:', response.data);
      
      // Remove the deleted variable from state
      setVariables(variables.filter(v => v._id !== variableId));
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
    }
  };

  const handlePIDAdd = async (newPID) => {
    try {
      const token = localStorage.getItem('token');
      console.log('MainPage - About to send PID data to server:', {
        name: newPID.name,
        pid: newPID.pid
      });
      
      const response = await axios.post('http://localhost:4000/pids', newPID, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('MainPage - Server response for new PID:', response.data);
      setPids(prevPids => [...prevPids, response.data]);
      setSelectedPID(response.data);
    } catch (error) {
      console.error('Error adding PID:', error.response?.data || error);
      alert('Error adding PID: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePIDDelete = async (pidId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4000/pids/${pidId}`, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove the deleted PID from state
      setPids(prevPids => prevPids.filter(p => p._id !== pidId));
      
      // If the deleted PID was selected, clear the selection
      if (selectedPID?._id === pidId) {
        setSelectedPID(null);
      }
    } catch (error) {
      console.error('Error deleting PID:', error);
      alert('Error deleting PID: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <PIDManager
        pids={pids}
        selectedPID={selectedPID}
        onPIDSelect={setSelectedPID}
        onPIDAdd={handlePIDAdd}
        onPIDDelete={handlePIDDelete}
      />
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <CodeEditor 
            code={code} 
            setCode={setCode} 
            variables={variables} 
          />
        </div>
        <div style={{ width: 300, marginLeft: 20 }}>
          <h2>Variables</h2>
          <VariableForm onVariableAdded={handleVariableAdded} />
          <div style={{ 
            marginTop: 20, 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px'
          }}>
            {variables.map((variable) => (
              <div 
                key={variable._id} 
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  position: 'relative'
                }}
              >
                <div><strong>Name:</strong> {variable.name}</div>
                <div><strong>Type:</strong> {variable.type}</div>
                <div><strong>Value:</strong> {variable.value}</div>
                <button
                  onClick={() => handleDeleteVariable(variable._id)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
