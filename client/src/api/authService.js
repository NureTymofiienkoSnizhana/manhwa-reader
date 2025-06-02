import api from './api';

// Register user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Login user
export const login = async (userData) => {
  try {
    const response = await api.post('/auth/login', userData);
    
    // Якщо користувач заблокований, не зберігаємо токен і просто передаємо дані
    if (response.data.ban) {
      console.log('Login detected banned user:', response.data.ban);
      return response.data;
    }
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    // Помилка 403 з інформацією про бан
    if (error.response && error.response.status === 403 && error.response.data.ban) {
      console.log('Login received 403 with ban info:', error.response.data);
      // Зберігаємо інформацію про бан у localStorage для BannedScreen
      localStorage.setItem('userBan', JSON.stringify(error.response.data.ban));
    }
    
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    
    // Оновлюємо дані користувача в localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    // Якщо є інформація про бан, зберігаємо її в localStorage
    if (response.data.userBan) {
      console.log('getCurrentUser detected ban:', response.data.userBan);
      localStorage.setItem('userBan', JSON.stringify(response.data.userBan));
    } else {
      // Якщо користувач не заблокований, видаляємо попередню інформацію про бан
      localStorage.removeItem('userBan');
    }
    
    return response.data;
  } catch (error) {
    // Перевіряємо, чи помилка пов'язана з баном
    if (error.response && error.response.status === 403 && error.response.data.ban) {
      console.log('getCurrentUser received 403 with ban info:', error.response.data);
      localStorage.setItem('userBan', JSON.stringify(error.response.data.ban));
    }
    
    throw error;
  }
};

// Update user preferences
export const updatePreferences = async (preferences) => {
  try {
    const response = await api.put('/auth/preferences', preferences);
    
    // Update local storage with new preferences
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...preferences
      }));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userBan'); 
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Get current user from localStorage
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get ban information from localStorage
export const getBanInfo = () => {
  const ban = localStorage.getItem('userBan');
  return ban ? JSON.parse(ban) : null;
};