import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../theme/theme';
import { updatePreferences } from '../api/authService';

// Create context
const ThemeContext = createContext();

// Context provider component
export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'true');
    } else {
      // Check for system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      localStorage.setItem('darkMode', prefersDark.toString());
    }
  }, []);
  
  // Toggle theme function
  const toggleTheme = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    // Update user preference in API if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await updatePreferences({ darkMode: newMode });
      } catch (error) {
        console.error('Failed to update theme preference:', error);
      }
    }
  };
  
  // Get current theme
  const theme = darkMode ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useTheme = () => useContext(ThemeContext);