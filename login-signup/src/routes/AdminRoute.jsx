import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const roleName = user?.role?.name || user?.role || null;
  const allowedRoles = ['admin', 'super admin'];
  if (!allowedRoles.includes((roleName || '').toLowerCase())) return <Navigate to="/user-dashboard" replace />;

  return children;
}
