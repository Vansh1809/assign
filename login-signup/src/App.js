import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Signup from './LoginSignup/Signup';
import Login from './LoginSignup/Login';
import Home from './LoginSignup/Home';
import DashboardPage from './pages/DashboardPage.jsx'
import GatewayRegistration from './pages/GatewayRegistration';
import DeviceBadgesPage from './pages/DeviceBadgesPage';
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminRoute from './routes/AdminRoute.jsx'
import EmailTemplatesAdminPage from './pages/EmailTemplatesAdminPage.jsx'


// ✨ Protected Route Component (auth)

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {

    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />

          <Route path='/signup' element={<Signup />} />

          <Route path='/login' element={<Login />} />
          <Route path='/home' element={<Home />} />

          {/* Protected Dashboard Route */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Users Route */}
          <Route
            path='/admin/users'
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />

          <Route
            path='/admin/email'
            element={
              <AdminRoute>
                <EmailTemplatesAdminPage />
              </AdminRoute>
            }
          />


          {/* Protected Gateway Registration Route */}
          <Route
            path='/register-gateway'
            element={
              <ProtectedRoute>
                <GatewayRegistration />
              </ProtectedRoute>
            }
          />

          {/* Protected Badge / Device Route */}
          <Route
            path='/devices'
            element={
              <ProtectedRoute>
                <DeviceBadgesPage />
              </ProtectedRoute>
            }
          />

          
          {/* Fallback Route */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
