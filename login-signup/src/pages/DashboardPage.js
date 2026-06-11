import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();

  // Step 3a: Auth Check - Agar token nahi hai to login page pe bhej do
  useEffect(() => {
    // Auth is handled by App.js ProtectedRoute using AuthContext.
    // Keep this component as a fallback UI without extra token logic.
  
    // No-op

  }, [navigate]);

  const handleLogout = () => {
    // logout handled in AuthContext; keep old behavior as safety.
    localStorage.removeItem('authToken');
    navigate('/login');
  };


  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#1a1a2e', color: 'white', padding: '20px' }}>
        <h2>My Dashboard</h2>
        <div style={{ marginTop: '20px' }}>📊 Analytics</div>
        <div style={{ marginTop: '20px' }}>🗺️ Map</div>
        <div style={{ marginTop: '20px' }}>⚙️ Settings</div>
        
        <div onClick={handleLogout} style={{ marginTop: 'auto', color: '#ff6b6b', cursor: 'pointer' }}>
          🚪 Logout
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* This file is not used by App.js anymore. Use DashboardPage.jsx for the actual dashboard. */}
        <p style={{ color: 'white' }}>Dashboard is loading...</p>
      </div>

    </div>
  );
};

export default DashboardPage;