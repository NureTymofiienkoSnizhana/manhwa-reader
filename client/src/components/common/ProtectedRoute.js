import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated, userBan } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (userBan && !loading && location.pathname !== '/banned') {
      console.log('User is banned, redirecting to banned page');
      navigate('/banned');
    }
  }, [userBan, loading, navigate, location.pathname]);
  
  if (loading) {
    return <Loader />;
  }
  
  if (userBan && location.pathname !== '/banned') {
    console.log('Redirecting banned user to /banned page');
    return <Navigate to="/banned" replace />;
  }
  
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('User does not have required role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;