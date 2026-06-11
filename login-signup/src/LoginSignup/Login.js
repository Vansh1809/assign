import React, { useState } from 'react';
import main from './main.jpg';
import Navbar from './Navbar';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [data, setData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!data.email || !data.password) {
      setMessage('Please enter both email and password.');
      return;
    }

    if (!emailPattern.test(data.email)) {
      setMessage('That email address looks invalid.');
      return;
    }

    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className='page-shell'>
        <div className='main-page'>
          <div className='auth-card'>
            <div className='form-head'>
              <p className='heading'>Login</p>
              <p className='subheading'>Access your workspace with one secure signin flow.</p>
            </div>
            <form className='auth-form' onSubmit={handleSubmit}>
              <div className='input-group'>
                <input
                  type='email'
                  placeholder='Email address'
                  name='email'
                  onChange={handleInput}
                  value={data.email}
                />
              </div>
              <div className='input-group password-group'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Password'
                  name='password'
                  onChange={handleInput}
                  value={data.password}
                />
                <button
                  type='button'
                  className='password-toggle'
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {message && <div className={`errMsg ${message.toLowerCase().includes('success') ? 'successMsg' : ''}`}>{message}</div>}
              <button className='auth-button' type='submit' disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
              <p className='hint-text'>No account yet? <Link to='/signup'>Create one</Link></p>
            </form>
          </div>
          <div className='hero-panel'>
            <img src={main} alt='Secure login illustration' />
            <div className='hero-caption'>
              <h3>Fast and polished auth</h3>
              <p>Instant feedback, secure API integration, and a clean login experience make this app feel professional and modern.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
