import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:4000';

export default function VariablesPage() {
  const [variables, setVariables] = useState([]);
  const [pids, setPids] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const varRes = await axios.get(`${API_URL}/variables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pidRes = await axios.get(`${API_URL}/pids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVariables(varRes.data);
      setPids(pidRes.data);
    };
    fetchData();
  }, []);

  return (
    <div style={{ margin: 20 }}>
      <h3>Variables</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr><th>Name</th><th>ID</th><th>Library</th></tr>
        </thead>
        <tbody>
          {variables.map(v => (
            <tr key={v._id}>
              <td>{v.name}</td>
              <td>{v.vid}</td>
              <td>{v.library}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
