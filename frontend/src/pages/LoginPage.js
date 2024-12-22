import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:4000';

function LoginPage() {
  console.log('LoginPage rendering');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('Attempting to', mode, 'with email:', email);

    try {
      const endpoint = mode === 'login' ? '/login' : '/signup';
      console.log('Making request to:', `${API_URL}/auth${endpoint}`);
      
      const { data } = await axios.post(`${API_URL}/auth${endpoint}`, {
        email,
        password
      });

      console.log('Response:', data);

      if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/main');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.msg || 'An error occurred');
    }
  };

  return (
    <div style={{ width: 300, margin: '100px auto' }}>
      <h2>{mode === 'login' ? 'Login' : 'Signup'}</h2>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input 
          type="email"
          value={email}
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
          required
        />
        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
          required
        />
        <button 
          type="submit"
          style={{ width: '100%', padding: '5px', marginBottom: 10 }}
        >
          {mode === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <button 
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        style={{ width: '100%', padding: '5px' }}
      >
        Switch to {mode === 'login' ? 'Signup' : 'Login'}
      </button>
    </div>
  );
}

export default LoginPage;
