// frontend/src/pages/MainPage.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';
import VariableForm from '../components/VariableForm';
import PIDManager from '../components/PIDManager';
import CSVUploader from '../components/CSVUploader';
import { FaLinkedin, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://bi-editor.herokuapp.com';

function CredentialsModal({ onSubmit, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
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
      <h3>GoodData Credentials</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
            required
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              background: '#007bff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MainPage() {
  // State management
  const [code, setCode] = useState('// Start typing...');
  const [variables, setVariables] = useState([]);
  const [pids, setPids] = useState([]);
  const [selectedPID, setSelectedPID] = useState(null);
  const [editingVariable, setEditingVariable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [metricsCount, setMetricsCount] = useState(0);
  const [user, setUser] = useState({ firstName: '', lastName: '' });

  // 'idle' | 'syncing' | 'success' | 'error'
  const [syncStatus, setSyncStatus] = useState('idle');

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Add this new state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // --------------------------------------------------------------------------
  //  USEEFFECTS: fetch data, restore selected PID
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchPIDs();
    fetchUserInfo();
    fetchMetricsCount();
  }, []);

  useEffect(() => {
    if (selectedPID) {
      fetchVariables(selectedPID._id);
    } else {
      setVariables([]);
    }
  }, [selectedPID]);

  useEffect(() => {
    if (pids.length > 0) {
      const lastSelectedPIDId = localStorage.getItem('lastSelectedPID');
      if (lastSelectedPIDId) {
        const foundPID = pids.find(pid => pid._id === lastSelectedPIDId);
        if (foundPID) {
          setSelectedPID(foundPID);
        }
      }
    }
  }, [pids]);

  useEffect(() => {
    if (selectedPID?._id) {
      localStorage.setItem('lastSelectedPID', selectedPID._id);
    }
  }, [selectedPID]);

  // Close user-menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --------------------------------------------------------------------------
  //  API Calls
  // --------------------------------------------------------------------------
  async function fetchPIDs() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/pids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPids(response.data);
    } catch (error) {
      console.error('Error fetching PIDs:', error);
    }
  }

  async function fetchVariables(pidId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/variables/${pidId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVariables(response.data);
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  }

  async function fetchUserInfo() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }

  async function fetchMetricsCount() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/metrics/copy-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetricsCount(response.data.count);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }

  // --------------------------------------------------------------------------
  //  GOODDATA SYNC
  // --------------------------------------------------------------------------
  const handleSyncFromGoodData = () => {
    if (!selectedPID?.pid) {
      alert('Please select a PID first!');
      return;
    }
    setShowCredentialsModal(true);
  };

  const handleCredentialsSubmit = async (username, password) => {
    setShowCredentialsModal(false);
    setSyncStatus('syncing');
    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}/gooddata/sync`;
      
      // Make sure we're using the correct PID from the selected project
      if (!selectedPID?.pid) {
        throw new Error('No project selected');
      }

      const response = await axios.post(
        url,
        {
          projectId: selectedPID.pid,
          pidRecordId: selectedPID._id,
          username,
          password
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      if (response.data.success) {
        // Show success message
        alert(response.data.message);
        setSyncStatus('success');
        // Refresh variables after successful sync initiation
        await fetchVariables(selectedPID._id);
      } else {
        throw new Error(response.data.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Error syncing GoodData:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      setSyncStatus('error');
      
      // Show error message to user
      alert(err.response?.data?.message || 'Failed to sync with GoodData. Please check your credentials and try again.');
    }
  };

  const renderSyncButtonText = () => {
    if (syncStatus === 'syncing') return 'Syncing...';
    if (syncStatus === 'success') return 'Sync Complete!';
    if (syncStatus === 'error')   return 'Sync Failed';
    return 'Sync Variables from GoodData';
  };

  // --------------------------------------------------------------------------
  //  LOGOUT
  // --------------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // --------------------------------------------------------------------------
  //  VARIABLE CRUD
  // --------------------------------------------------------------------------
  const handleVariableAdded = (newVariable) => {
    setVariables(prev => [...prev, newVariable]);
  };
  const handleVariablesUploaded = (newVars) => {
    setVariables(prev => [...prev, ...newVars]);
  };
  const handleDeleteVariable = async (variableId) => {
    if (!window.confirm('Are you sure you want to delete this variable?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/variables/${selectedPID._id}/${variableId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVariables(prev => prev.filter(v => v._id !== variableId));
    } catch (error) {
      console.error('Error deleting variable:', error);
    }
  };
  const handleEdit = (variable) => {
    setEditingVariable(variable);
  };
  const handleUpdateVariable = async (updatedVar) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/variables/${selectedPID._id}/${updatedVar._id}`,
        updatedVar,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVariables(prev => prev.map(v => v._id === updatedVar._id ? updatedVar : v));
      setEditingVariable(null);
    } catch (err) {
      console.error('Error updating variable:', err);
    }
  };

  // --------------------------------------------------------------------------
  //  PID CRUD
  // --------------------------------------------------------------------------
  const handlePIDAdd = async (newPID) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/pids`, newPID, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPids(prev => [...prev, response.data]);
      setSelectedPID(response.data);
    } catch (error) {
      console.error('Error adding PID:', error);
      alert('Error adding PID: ' + (error.response?.data?.message || error.message));
    }
  };
  const handlePIDDelete = async (pidId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/pids/${pidId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPids(prev => prev.filter(p => p._id !== pidId));
      if (selectedPID?._id === pidId) {
        setSelectedPID(null);
      }
    } catch (error) {
      console.error('Error deleting PID:', error);
      alert('Error deleting PID: ' + (error.response?.data?.message || error.message));
    }
  };

  // --------------------------------------------------------------------------
  //  SEARCH FILTER
  // --------------------------------------------------------------------------
  const filteredVariables = variables.filter(variable =>
    variable.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --------------------------------------------------------------------------
  //  RENDER
  // --------------------------------------------------------------------------
  return (
    <>
      {/* Top Banner */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={require('../assets/MAQLExpressLogo.png')}
            alt="MAQL Express Editor Logo"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
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
        </div>

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
          <div style={{ position: 'relative' }} ref={dropdownRef}>
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
                    color: '#333'
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal black line */}
      <div style={{ 
        left: 0,
        right: 0,
        height: '5px',
        backgroundColor: 'black',
        zIndex: 1
      }} />

      {/* MAIN CONTENT */}
      <div style={{ 
        marginLeft: '5%',
        marginRight: '5%',
        minHeight: 'calc(100vh - 130px)',
        overflowY: 'auto',
        paddingBottom: '60px',
        paddingTop: '20px'
      }}>
        {/* The PID Manager with increased width */}
        <div style={{ width: '150%' }}>
          <PIDManager
            pids={pids}
            selectedPID={selectedPID}
            onPIDSelect={setSelectedPID}
            onPIDAdd={handlePIDAdd}
            onPIDDelete={handlePIDDelete}
            handleSyncFromGoodData={handleSyncFromGoodData}
            syncStatus={syncStatus}
            renderSyncButtonText={renderSyncButtonText}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '20px',
          marginBottom: '20px',
          justifyContent: 'flex-start'
        }}>
          {/* Variable Form */}
          <div style={{ width: '25%' }}>
            <VariableForm 
              onVariableAdded={handleVariableAdded} 
              selectedPID={selectedPID}
            />
          </div>
          {/* CSV Uploader */}
          <div style={{ width: '25%' }}>
            <CSVUploader 
              selectedPID={selectedPID}
              onVariablesAdded={handleVariablesUploaded}
            />
          </div>
          {/* Search Box */}
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
                  variables.filter(v => 
                    v.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length > 0 ? (
                    variables.filter(v =>
                      v.name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((variable) => (
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

        {/* Code Editor */}
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
                onCopySuccess={fetchMetricsCount}
              />
            </div>
          </div>
        </div>

        {/* Edit Variable Modal */}
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

        {/* Credentials Modal */}
        {showCredentialsModal && (
          <CredentialsModal
            onSubmit={handleCredentialsSubmit}
            onCancel={() => setShowCredentialsModal(false)}
          />
        )}
      </div>

      {/* Bottom black line */}
      <div style={{ 
        left: 0,
        right: 0,
        bottom: '60px',
        height: '5px',
        backgroundColor: 'black',
        zIndex: 1
      }} />

      {/* Footer */}
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
          Version 1.3.0
        </div>
      </div>
    </>
  );
}
