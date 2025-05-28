import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, login, register, logout as logoutService } from '../api/authService';

// Create context
const AuthContext = createContext();

// Context provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userBan, setUserBan] = useState(null);

  const navigate = useNavigate();
  
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const { user } = await getCurrentUser();
          setUser(user);

          if (userBan) {
          setUserBan(userBan);
          }
        } catch (error) {
          console.error('Failed to authenticate token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []);
  
  // Login function
  const loginUser = async (credentials) => {
    try {
      setError(null);
      const data = await login(credentials);
      setUser(data.user);
      return data;
    } catch (error) {
      setError(error.message || 'Login failed');
      throw error;
    }
  };
  
  // Register function
  const registerUser = async (userData) => {
    try {
      setError(null);
      const data = await register(userData);
      setUser(data.user);
      return data;
    } catch (error) {
      setError(error.message || 'Registration failed');
      throw error;
    }
  };
  
  // Logout function
  const logout = () => {
    logoutService();
    setUser(null);
    navigate('/login');
  };
  
  // Update user function
  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
    
    // Update in localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...storedUser,
      ...userData
    }));
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      loginUser, 
      registerUser, 
      logout,
      updateUser,
      isAuthenticated: !!user,
      userBan
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);