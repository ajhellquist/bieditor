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
  const [editingVariable, setEditingVariable] = useState(null);

  useEffect(() => {
    fetchPIDs();
  }, []);

  useEffect(() => {
    if (selectedPID) {
      fetchVariables(selectedPID._id);
    } else {
      setVariables([]);
    }
  }, [selectedPID]);

  const fetchVariables = async (pidId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/variables/${pidId}`, {
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
      await axios.delete(
        `http://localhost:4000/variables/${selectedPID._id}/${variableId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVariables(variables.filter(v => v._id !== variableId));
    } catch (error) {
      console.error('Error deleting variable:', error);
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

  const getActualReferences = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const spans = tempDiv.getElementsByTagName('span');
    const references = [];
    
    for (let span of spans) {
      references.push(span.getAttribute('data-reference'));
    }
    
    return references;
  };

  const getDisplayText = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent;
  };

  const handleEdit = (variable) => {
    setEditingVariable(variable);
  };

  const handleUpdateVariable = async (updatedVariable) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:4000/variables/${selectedPID._id}/${updatedVariable._id}`,
        updatedVariable,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVariables(variables.map(v => 
        v._id === updatedVariable._id ? updatedVariable : v
      ));
      setEditingVariable(null);
    } catch (error) {
      console.error('Error updating variable:', error);
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
            selectedPID={selectedPID}
          />
        </div>
        <div style={{ width: 300, marginLeft: 20 }}>
          <h2>Variables</h2>
          <VariableForm 
            onVariableAdded={handleVariableAdded} 
            selectedPID={selectedPID}
          />
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
                  paddingTop: '35px',
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
                  onClick={() => handleEdit(variable)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '30px',
                    background: '#4444ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
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
          
          {editingVariable && (
            <div style={{ marginTop: '20px' }}>
              <h3>Edit Variable</h3>
              <VariableForm 
                initialData={editingVariable}
                onVariableAdded={handleUpdateVariable}
                selectedPID={selectedPID}
                isEditing={true}
                submitButtonText="Save"
              />
              <button 
                onClick={() => setEditingVariable(null)}
                style={{ marginTop: '10px', padding: '5px 10px' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      {console.log('MainPage selectedPID:', selectedPID)}
    </div>
  );
}
