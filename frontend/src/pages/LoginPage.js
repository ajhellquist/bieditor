import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://bi-editor.herokuapp.com';

/**
 * LoginPage Component
 * Handles both user login and signup functionality with a togglable form.
 * Manages user authentication state and redirects to main page upon successful auth.
 */
function LoginPage() {
  console.log('LoginPage rendering');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();

  /**
   * Handles form submission for both login and signup.
   * Sends authentication request to the backend and processes the response.
   * @param {Event} e - The form submission event
   */
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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* Background GIF container */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '95%',
        height: '70%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1
      }}>
        <img 
          src={require('../assets/MEpreview.gif')}
          alt="Application Preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Semi-transparent overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 253, 248, 0.85)',
        zIndex: 2
      }} />

      {/* Login form container */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Form container */}
        <div style={{ 
          width: 300,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Logo image */}
          <img 
            src={require('../assets/MAQLExpressLogo.png')}
            alt="MAQL Express Editor Logo"
            style={{
              width: '100px',
              height: 'auto',
              display: 'block',
              margin: '0 auto 20px auto'
            }}
          />
          
          {/* Application title/logo */}
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

          {/* Dynamic form header based on current mode */}
          <h2>{mode === 'login' ? 'Login' : 'Signup'}</h2>

          {/* Error message display */}
          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

          {/* Authentication form */}
          <form onSubmit={handleSubmit}>
            {/* Conditional rendering of name fields for signup mode */}
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
            
            {/* Common authentication fields */}
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

            {/* Submit button with dynamic text based on mode */}
            <button 
              type="submit"
              style={{ width: '100%', border: '3px solid black', borderRadius: '4px', padding: '5px', marginBottom: 10 }}
            >
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>

          {/* Mode toggle button to switch between login and signup */}
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{ width: '100%', border: '3px solid black', borderRadius: '4px', padding: '5px' }}
          >
            Switch to {mode === 'login' ? 'Signup' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
