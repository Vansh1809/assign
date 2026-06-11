import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../AuthContext';

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <Navbar />
      <div className='page-shell'>
        <div className='home-card'>
          <h2>{user ? `Welcome back, ${user.name}!` : 'Build a standout auth experience'}</h2>
          <p>
            {user
              ? 'You are signed in with a polished flow and secure backend validation.'
              : 'Sign up or login with real-time validation, password strength feedback, and a modern UI.'}
          </p>
          <div className='home-actions'>
            {user ? (
              <button onClick={logout}>Sign out</button>
            ) : (
              <>
                <Link className='auth-button' to='/signup'>Create an account</Link>
                <Link className='auth-button' to='/login'>Login</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
