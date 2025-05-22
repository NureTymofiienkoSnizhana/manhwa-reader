import { useState, useCallback } from 'react';

// Simplified notification hook when notistack is not available
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);
  
  const showNotification = useCallback((message, options = {}) => {
    console.log(`Notification: ${message}`, options);
    // In a real implementation with notistack, this would show a snackbar
    setNotifications(prev => [...prev, { message, ...options }]);
  }, []);
  
  const showSuccess = useCallback((message, options = {}) => {
    showNotification(message, { ...options, variant: 'success' });
  }, [showNotification]);
  
  const showError = useCallback((message, options = {}) => {
    showNotification(message, { ...options, variant: 'error' });
  }, [showNotification]);
  
  const showWarning = useCallback((message, options = {}) => {
    showNotification(message, { ...options, variant: 'warning' });
  }, [showNotification]);
  
  const showInfo = useCallback((message, options = {}) => {
    showNotification(message, { ...options, variant: 'info' });
  }, [showNotification]);
  
  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};