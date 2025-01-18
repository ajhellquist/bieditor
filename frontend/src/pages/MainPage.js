import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';
import VariableForm from '../components/VariableForm';
import PIDManager from '../components/PIDManager';
import CSVUploader from '../components/CSVUploader';
import { FaLinkedin, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://bi-editor.herokuapp.com';

export default function MainPage() {
  // State management for application data
  const [code, setCode] = useState('// Start typing...');
  const [variables, setVariables] = useState([]);
  const [pids, setPids] = useState([]);
  const [selectedPID, setSelectedPID] = useState(null);
  const [editingVariable, setEditingVariable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [metricsCount, setMetricsCount] = useState(0);
  const [user, setUser] = useState({ firstName: '', lastName: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPIDs();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (selectedPID) {
      fetchVariables(selectedPID._id);
    } else {
      setVariables([]);
    }
  }, [selectedPID]);

  useEffect(() => {
    fetchMetricsCount();
  }, []);

  /**
   * Fetches variables associated with the selected PID
   * @param {string} pidId - The ID of the selected PID
   */
  const fetchVariables = async (pidId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/variables/${pidId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVariables(response.data);
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  };

  /**
   * Fetches all PIDs associated with the current user
   */
  const fetchPIDs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching PIDs with token:', token);
      const response = await axios.get(`${API_URL}/pids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched PIDs from server:', response.data);
      setPids(response.data);
    } catch (error) {
      console.error('Error fetching PIDs:', error);
    }
  };

  /**
   * Retrieves the total count of metrics created by the user
   */
  const fetchMetricsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/metrics/copy-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetricsCount(response.data.count);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  /**
   * Fetches current user's information from the server
   */
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching user info with token:', token);
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Received user data:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error.response?.data || error);
    }
  };

  // Variable management handlers
  const handleVariableAdded = (newVariable) => {
    setVariables([...variables, newVariable]);
  };

  /**
   * Deletes a variable and updates the UI
   * @param {string} variableId - The ID of the variable to delete
   */
  const handleDeleteVariable = async (variableId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/variables/${selectedPID._id}/${variableId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVariables(variables.filter(v => v._id !== variableId));
    } catch (error) {
      console.error('Error deleting variable:', error);
    }
  };

  /**
   * Creates a new PID and updates the UI
   * @param {Object} newPID - The PID object containing name and pid
   */
  const handlePIDAdd = async (newPID) => {
    try {
      const token = localStorage.getItem('token');
      console.log('MainPage - About to send PID data to server:', {
        name: newPID.name,
        pid: newPID.pid
      });
      
      const response = await axios.post(`${API_URL}/pids`, newPID, {
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

  /**
   * Deletes a PID and updates the UI
   * @param {string} pidId - The ID of the PID to delete
   */
  const handlePIDDelete = async (pidId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/pids/${pidId}`, {
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

  /**
   * Utility function to extract references from HTML content
   * @param {string} htmlContent - The HTML content to parse
   * @returns {Array} Array of reference attributes
   */
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

  /**
   * Utility function to extract plain text from HTML content
   * @param {string} htmlContent - The HTML content to parse
   * @returns {string} The plain text content
   */
  const getDisplayText = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent;
  };

  // Variable editing handlers
  const handleEdit = (variable) => {
    setEditingVariable(variable);
  };

  /**
   * Updates an existing variable and refreshes the UI
   * @param {Object} updatedVariable - The modified variable object
   */
  const handleUpdateVariable = async (updatedVariable) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/variables/${selectedPID._id}/${updatedVariable._id}`,
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

  // Filter variables based on search term
  const filteredVariables = variables.filter(variable => 
    variable.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CSV upload handler
  const handleVariablesUploaded = (newVariables) => {
    setVariables([...variables, ...newVariables]);
  };

  // Authentication handlers
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  /**
   * Updates the metrics count after successful metric creation
   */
  const refreshMetricsCount = async () => {
    await fetchMetricsCount();
  };

  return (
    <>
      <style>
        {`
          .search-input::placeholder {
            color: #666;
          }
        `}
      </style>
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
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '5%',
        paddingRight: '5%'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '400',
          margin: 0,
          padding: 0,
          textAlign: 'left'
        }}>
          <span style={{ color: '#FFC380' }}>MAQL</span>
          <span style={{ color: '#333' }}> Express</span>
          <span style={{ color: '#333' }}> Editor</span>
        </h1>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          <span style={{ 
            color: '#333',
            fontSize: '16px'
          }}>
            Welcome, {user.firstName} {user.lastName}
          </span>
          <div style={{ position: 'relative' }}>
            <FaUserCircle 
              size={30} 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ cursor: 'pointer', color: '#333' }}
            />
            
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '180px'
              }}>
                <div style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #ddd',
                  fontSize: '14px',
                  color: '#333'
                }}>
                  Metrics Created 🚀: {metricsCount}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#333',
                    ':hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ 
        left: 0,
        right: 0,
        height: '5px',
        backgroundColor: 'black',
        zIndex: 1
      }} />

      <div style={{ 
        marginLeft: '5%',
        marginRight: '5%',
        minHeight: 'calc(100vh - 130px)',
        overflowY: 'auto',
        paddingBottom: '60px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          marginTop: '20px',
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
                className="search-input"
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
                            Del
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
                onCopySuccess={refreshMetricsCount}
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
            borderRadius: '12px',
            border: '3px solid black',
            boxShadow: '5px 5px 10px rgb(0, 0, 0)',
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
              onCancel={() => setEditingVariable(null)}
            />
          </div>
        )}
      </div>

      <div style={{ 
        //position: 'fixed',
        left: 0,
        right: 0,
        bottom: '60px',
        height: '5px',
        backgroundColor: 'black',
        zIndex: 1
      }} />

      <div style={{
        height: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Roboto, sans-serif',
        fontSize: '13px',
        color: 'black',
        gap: '5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          made with ❤️ by andrew hellquist
          <a 
            href="https://www.linkedin.com/in/ajhellquist/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#0077B5',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '5px'
            }}
          >
            <FaLinkedin size={20} />
          </a>
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Version 1.2.0
        </div>
      </div>
    </>
  );
}
