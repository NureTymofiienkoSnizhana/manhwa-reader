import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePreferences } from '../api/authService';

// Create context
const LanguageContext = createContext();

// Context provider component
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState('en');
  
  // Initialize language from localStorage or browser
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguage(savedLang);
      i18n.changeLanguage(savedLang);
    } else {
      // Default to browser language if available and supported
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = ['en', 'ua'].includes(browserLang) ? browserLang : 'en';
      setLanguage(supportedLang);
      i18n.changeLanguage(supportedLang);
      localStorage.setItem('language', supportedLang);
    }
  }, [i18n]);
  
  // Change language function
  const changeLanguage = async (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Update user preference in API if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await updatePreferences({ language: lang });
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };
  
  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using language context
export const useLanguage = () => useContext(LanguageContext);