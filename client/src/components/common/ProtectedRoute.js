import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated, userBan } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (userBan && !loading) {
      navigate('/banned');
    }
  }, [userBan, loading, navigate]);
  
  if (loading) {
    return <Loader />;
  }
  
  if (userBan) {
    return <Navigate to="/banned" replace />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;