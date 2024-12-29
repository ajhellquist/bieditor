import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VariableForm from '../components/VariableForm';

const API_URL = 'http://localhost:4000';

export default function VariablesPage() {
  console.log('VariablesPage component rendering');
  
  const [variables, setVariables] = useState([]);
  const [pids, setPids] = useState([]);
  const [editingVariable, setEditingVariable] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      console.log('Current token:', token);
      
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }

      try {
        // First fetch PIDs
        console.log('Fetching PIDs...');
        const pidRes = await axios.get(`${API_URL}/pids`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('PIDs received:', pidRes.data);
        setPids(pidRes.data);
        
        // Then fetch variables for each PID
        const allVariables = [];
        for (const pid of pidRes.data) {
          console.log(`Fetching variables for PID: ${pid._id}`);
          const varRes = await axios.get(`${API_URL}/variables/${pid._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Variables received:', varRes.data);
          allVariables.push(...varRes.data);
        }
        console.log('All variables:', allVariables);
        setVariables(allVariables);
      } catch (err) {
        console.error('Error fetching data:', err.response?.data?.message || err.message);
        console.error('Full error:', err.response || err);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (variable) => {
    setEditingVariable(variable);
  };

  const handleUpdateVariable = (updatedVariable) => {
    setVariables(variables.map(v => 
      v._id === updatedVariable._id ? updatedVariable : v
    ));
    setEditingVariable(null);
  };

  return (
    <div style={{ margin: 20 }}>
      <div style={{ color: 'red' }}>Debug: VariablesPage is rendering</div>
      <h3>Variables</h3>
      {variables.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>Name</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Type</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Value</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Element ID</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variables.map(variable => (
              <tr key={variable._id}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{variable.name}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{variable.type}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{variable.value}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{variable.elementId}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>
                  <button 
                    onClick={() => handleEdit(variable)}
                    style={{ padding: '5px 10px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No variables found</p>
      )}

      {editingVariable && (
        <div style={{ marginTop: '20px' }}>
          <h3>Edit Variable</h3>
          <VariableForm 
            initialData={editingVariable}
            onVariableAdded={handleUpdateVariable}
            selectedPID={{ _id: editingVariable.pidId }}
            isEditing={true}
          />
          <button 
            onClick={() => setEditingVariable(null)}
            style={{ marginTop: '10px', padding: '5px 10px' }}
          >
            Cancel
          </button>
        </div>
      )}

      <h3>PIDs</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr><th>Name</th><th>ID</th></tr>
        </thead>
        <tbody>
          {pids.map(p => (
            <tr key={p._id}>
              <td>{p.pidName}</td>
              <td>{p.pidId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
