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
          const response = await getCurrentUser();
          setUser(response.user);
          
          if (response.userBan) {
            console.log('User is banned:', response.userBan);
            setUserBan(response.userBan);
            navigate('/banned'); 
          } else {
            setUserBan(null);
          }
        } catch (error) {
          console.error('Failed to authenticate token:', error);
          
          if (error.response && error.response.status === 403 && error.response.data.ban) {
            console.log('User is banned (from error):', error.response.data.ban);
            setUserBan(error.response.data.ban);
            navigate('/banned');
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setUserBan(null);
          }
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, [navigate]);
  
  // Login function
  const loginUser = async (credentials) => {
    try {
      setError(null);
      const data = await login(credentials);
      
      if (data.userBan) {
        console.log('User is banned during login:', data.userBan);
        setUserBan(data.userBan);
        setUser(data.user);
        navigate('/banned');
        return data;
      }
      
      setUser(data.user);
      setUserBan(null);
      return data;
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.data.ban) {
        console.log('User is banned (login error):', error.response.data.ban);
        setUserBan(error.response.data.ban);
        navigate('/banned');
      }
      
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
      setUserBan(null);
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
    setUserBan(null);
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

  // Check ban status regularly (every 60 seconds)
  useEffect(() => {
    let interval;
    
    if (user && !userBan) {
      interval = setInterval(async () => {
        try {
          const response = await getCurrentUser();
          
          if (response.userBan) {
            console.log('User ban detected during interval check:', response.userBan);
            setUserBan(response.userBan);
            navigate('/banned');
          }
        } catch (error) {
          if (error.response && error.response.status === 403 && error.response.data.ban) {
            console.log('User ban detected during interval check (error):', error.response.data.ban);
            setUserBan(error.response.data.ban);
            navigate('/banned');
          }
        }
      }, 60000); 
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, userBan, navigate]);
  
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