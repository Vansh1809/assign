import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('authUser')) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('authToken') || null;
    } catch {
      return null;
    }
  });

  // ✅ NEW: Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // ✅ NEW: Check if user is admin (support role as string or object)
  const isAdmin = (() => {
    const role = user?.role;
    const roleName = typeof role === 'string' ? role : role?.name;
    return (roleName || '').toLowerCase() === 'admin';
  })();


  const saveUser = (value) => {
    setUser(value);
    if (value) {
      localStorage.setItem('authUser', JSON.stringify(value));
    } else {
      localStorage.removeItem('authUser');
    }
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    // Backend returns { token, user }
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
    }

    saveUser(data.user);
    return data.user;
  };

  const signup = async (name, email, password) => {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed.');
    }
    return data.message;
  };

  const logout = () => {
    saveUser(null);
    setToken(null);
    try {
      localStorage.removeItem('authToken');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      isAdmin, 
      login, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}