import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const roleName = user?.role?.name || user?.role || null;

  if (roleName !== 'Admin') return <Navigate to="/dashboard" replace />;

  return children;
}

