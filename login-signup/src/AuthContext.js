import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const toNetworkErrorMessage = (err) => {
  // fetch/axios “Failed to fetch” -> browser network error (no HTTP response)
  const message = err?.message || '';
  if (message.toLowerCase().includes('failed to fetch')) {
    return 'Unable to connect to server. Please ensure the backend is running and CORS/URL/port are correct, then try again.';
  }
  return 'Unable to connect to server. Please try again.';
};


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

  // ✅ Check if user is admin (support backend RBAC: "admin" and "super admin")
  const isAdmin = (() => {
    const role = user?.role;
    const roleName = typeof role === 'string' ? role : role?.name;
    const normalized = (roleName || '').toString().trim().toLowerCase();
    return normalized === 'admin' || normalized === 'super admin';
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
    let response;
    try {
      response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch (err) {
      throw new Error(toNetworkErrorMessage(err));
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      // backend might not respond with JSON
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Login failed.');
    }

    // Backend returns { token, user }
    if (data?.token) {
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
    }

    saveUser(data?.user || null);
    return data?.user;
  };

  // NOTE: signup with profile picture is handled by LoginSignup/Signup.js (multipart/form-data).
  // This method is kept for compatibility (no profilePicture).
  const signup = async (name, email, password) => {
    let response;
    try {
      response = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
    } catch (err) {
      throw new Error(toNetworkErrorMessage(err));
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Signup failed.');
    }
    return data?.message;
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