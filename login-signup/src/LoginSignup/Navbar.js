import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className='navbar-shell'>
      <nav className='navbar'>
        <div className='brand'>
          <Link to='/' className='nav-link'>Auth Studio</Link>
        </div>
        <ul>
          {user ? (
            <>
              <li>
                <NavLink to='/home' className='nav-link' end>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <button type='button' className='nav-link nav-logout' onClick={logout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to='/' className='nav-link' end>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to='/login' className='nav-link'>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to='/signup' className='nav-link nav-signup'>
                  Sign Up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
