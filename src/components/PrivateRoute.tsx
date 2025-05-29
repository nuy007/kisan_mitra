import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { session } = useAuth();

  if (!session.user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}