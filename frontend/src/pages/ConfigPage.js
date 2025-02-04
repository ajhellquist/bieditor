import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://bi-editor.herokuapp.com';

export default function ConfigPage() {
  // State to store configuration values from the server
  const [configs, setConfigs] = useState({ metrics: '', attributes: '', values: '' });

  // Fetch existing configurations on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/config`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data) setConfigs(data);
      } catch (err) { /* handle error */ }
    };
    fetchConfig();
  }, []);

  // Update configurations on the server when user saves changes
  const updateConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/config`, configs, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigs(data);
    } catch (err) { /* handle error */ }
  };

  return (
    <div style={{ margin: 20 }}>
      <h3>Library Output Formats</h3>
      <div>
        <label>Metrics Format</label><br />
        <textarea
          rows="2"
          value={configs.metrics}
          onChange={e => setConfigs({ ...configs, metrics: e.target.value })}
        />
      </div>
      <div>
        <label>Attributes Format</label><br />
        <textarea
          rows="2"
          value={configs.attributes}
          onChange={e => setConfigs({ ...configs, attributes: e.target.value })}
        />
      </div>
      <div>
        <label>Values Format</label><br />
        <textarea
          rows="2"
          value={configs.values}
          onChange={e => setConfigs({ ...configs, values: e.target.value })}
        />
      </div>
      <button onClick={updateConfig}>Save Config</button>
    </div>
  );
}
