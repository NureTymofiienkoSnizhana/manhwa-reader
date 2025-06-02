import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration and ban
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) responses
    if (error.response && error.response.status === 401) {
      // Remove token and redirect to login if token is expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle 403 (Forbidden) responses with ban information
    if (error.response && error.response.status === 403 && error.response.data.ban) {
      console.log('API interceptor detected ban:', error.response.data.ban);
      
      // Store ban information
      localStorage.setItem('userBan', JSON.stringify(error.response.data.ban));
      
      // Check if we're already on the banned page
      if (!window.location.pathname.includes('/banned')) {
        // Redirect to banned page
        window.location.href = '/banned';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;