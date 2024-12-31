import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';
import VariableForm from '../components/VariableForm';
import PIDManager from '../components/PIDManager';
import CSVUploader from '../components/CSVUploader';

export default function MainPage() {
  const [code, setCode] = useState('// Start typing...');
  const [variables, setVariables] = useState([]);
  const [pids, setPids] = useState([]);
  const [selectedPID, setSelectedPID] = useState(null);
  const [editingVariable, setEditingVariable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredVariables = variables.filter(variable => 
    variable.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVariablesUploaded = (newVariables) => {
    setVariables([...variables, ...newVariables]);
  };

  const handleDownloadTemplate = () => {
    // Implementation for downloading template
  };

  return (
    <>
      <div style={{ 
        backgroundColor: '#FFFDF8',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1
      }} />
      <div style={{ 
        marginTop: '60px',
        left: 0,
        right: 0,
        height: '5px',
        backgroundColor: 'black',
        zIndex: 1
      }} />
      <div style={{ 
        marginLeft: '5%',
        marginRight: '5%',
        minHeight: '100vh',
        overflowY: 'auto'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '400',
          color: '#333',
          margin: '20px 0',
          padding: 0,
          textAlign: 'left'
        }}>
          MAQL Express Editor
        </h1>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ width: '1000px' }}>
            <PIDManager
              pids={pids}
              selectedPID={selectedPID}
              onPIDSelect={setSelectedPID}
              onPIDAdd={handlePIDAdd}
              onPIDDelete={handlePIDDelete}
              style={{ width: '200px' }}
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '20px',
          marginBottom: '20px',
          justifyContent: 'flex-start'
        }}>
          <div style={{ width: '25%' }}>
            <VariableForm 
              onVariableAdded={handleVariableAdded} 
              selectedPID={selectedPID}
            />
          </div>
          <div style={{ width: '25%' }}>
            <CSVUploader 
              selectedPID={selectedPID}
              onVariablesAdded={handleVariablesUploaded}
            />
          </div>
          <div style={{ width: '25%' }}>
            <div style={{ 
              marginTop: '0',
              border: '3px solid black',
              borderRadius: '12px',
              padding: '15px',
              backgroundColor: '#FFF4DA',
              height: '300px',
              display: 'flex',
              flexDirection: 'column',
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
                <span style={{ fontWeight: '500', fontFamily: 'Times New Roman' }}>Search Variables</span>
              </div>

              <input
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid black',
                  boxSizing: 'border-box',
                  marginBottom: '10px',
                  fontFamily: 'Times New Roman'
                }}
              />

              <div style={{ 
                flex: 1,
                overflowY: 'auto',
                border: '1px solid black',
                borderRadius: '4px',
                padding: '10px',
                backgroundColor: '#FFFFFF'
              }}>
                {searchTerm ? (
                  filteredVariables.length > 0 ? (
                    filteredVariables.map((variable) => (
                      <div key={variable._id} style={{
                        padding: '8px',
                        marginBottom: '5px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        border: '1px solid black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>{variable.name}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleEdit(variable)}
                            style={{
                              background: '#FFC107',
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
                      </div>
                    ))
                  ) : (
                    <p>No matching variables found</p>
                  )
                ) : (
                  <p>Type to search variables</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              border: '3px solid black',
              borderRadius: '12px',
              padding: '15px',
              backgroundColor: '#FFF4DA',
              height: '550px',
              boxShadow: '5px 5px 10px rgb(0, 0, 0)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '7px',
                borderBottom: '1px solid #eee',
                paddingBottom: '10px',
                height: '25px'
              }}>
                <span style={{ fontWeight: '500', fontFamily: 'Times New Roman' }}>Code Editor</span>
              </div>
              
              <CodeEditor 
                code={code} 
                setCode={setCode} 
                variables={variables} 
                selectedPID={selectedPID}
              />
            </div>
          </div>
        </div>

        {editingVariable && (
          <div style={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            width: '400px'
          }}>
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
    </>
  );
}
