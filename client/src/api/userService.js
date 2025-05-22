import api from './api';

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const url = userId ? `/users/profile/${userId}` : '/users/profile';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get user reading history
export const getUserReadingHistory = async (page = 1, limit = 10, status) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    
    const response = await api.get('/users/reading-history', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put('/users/role', { userId, role });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};