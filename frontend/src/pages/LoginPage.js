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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('Attempting to', mode, 'with email:', email);

    try {
      const endpoint = mode === 'login' ? '/login' : '/signup';
      console.log('Making request to:', `${API_URL}/auth${endpoint}`);
      
      const payload = mode === 'login' 
        ? { email, password }
        : { email, password, firstName, lastName };
      
      const { data } = await axios.post(`${API_URL}/auth${endpoint}`, payload);

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
    <div style={{ 
      backgroundColor: '#FFFDF8',
      minHeight: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ width: 300 }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '400',
          margin: 0,
          padding: 0,
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <span style={{ color: '#FFC380' }}>MAQL</span>
          <span style={{ color: '#333' }}> Express</span>
          <span style={{ color: '#333' }}> Editor</span>
        </h1>
        <h2>{mode === 'login' ? 'Login' : 'Signup'}</h2>
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <input 
                type="text"
                value={firstName}
                placeholder="First Name"
                onChange={e => setFirstName(e.target.value)}
                style={{ width: '100%', marginBottom: 10 }}
                required
              />
              <input 
                type="text"
                value={lastName}
                placeholder="Last Name"
                onChange={e => setLastName(e.target.value)}
                style={{ width: '100%', marginBottom: 10 }}
                required
              />
            </>
          )}
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
            style={{ width: '100%', border: '3px solid black', borderRadius: '4px', padding: '5px', marginBottom: 10 }}
          >
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button 
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          style={{ width: '100%', border: '3px solid black', borderRadius: '4px', padding: '5px' }}
        >
          Switch to {mode === 'login' ? 'Signup' : 'Login'}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
