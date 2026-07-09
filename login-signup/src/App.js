import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Signup from './LoginSignup/Signup';
import Login from './LoginSignup/Login';
import Home from './LoginSignup/Home';
import DashboardPage from './pages/DashboardPage.jsx'
import UserDashboardPage from './pages/UserDashboardPage.jsx'
import MapViewPage from './pages/MapViewPage.jsx'
import GatewayRegistration from './pages/GatewayRegistration';
import DeviceBadgesPage from './pages/DeviceBadgesPage';
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminRoute from './routes/AdminRoute.jsx'
import EmailTemplatesAdminPage from './pages/EmailTemplatesAdminPage.jsx'
import AdminRolesPage from './pages/AdminRolesPage.jsx'
import RolePermissionsPage from './pages/RolePermissionsPage.jsx'

// Import unified design system
import './styles/theme.css';
import './styles/utilities.css';



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
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            }
          />

          <Route
            path='/user-dashboard'
            element={
              <ProtectedRoute>
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/map-view'
            element={
              <ProtectedRoute>
                <MapViewPage />
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

          {/* Protected Admin Roles/Permissions Routes */}
          <Route
            path='/admin/roles'
            element={
              <AdminRoute>
                <AdminRolesPage />
              </AdminRoute>
            }
          />

          <Route
            path='/admin/role-permissions'
            element={
              <AdminRoute>
                <RolePermissionsPage />
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
