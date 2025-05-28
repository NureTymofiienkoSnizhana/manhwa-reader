import api from './api';

// Get all users 
export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Update user role
export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put('/admin/users/role', { userId, role });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Unban user
export const unbanUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/ban/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Search users by query
export const searchUsers = async (query) => {
  try {
    const response = await api.get('/admin/users/search', { params: { query } });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get level tasks
export const getLevelTasks = async () => {
  try {
    const response = await api.get('/admin/level-tasks');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Create or update level task
export const updateLevelTask = async (level, taskData) => {
  try {
    const response = await api.post(`/admin/level-tasks/${level}`, taskData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Delete level task
export const deleteLevelTask = async (level) => {
  try {
    const response = await api.delete(`/admin/level-tasks/${level}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get active bans
export const getActiveBans = async () => {
  try {
    const response = await api.get('/admin/bans/active');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get ban history
export const getBanHistory = async () => {
  try {
    const response = await api.get('/admin/bans/history');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Ban user
export const banUser = async (banData) => {
  try {
    const response = await api.post('/admin/ban', banData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};



// Get platform statistics
export const getPlatformStatistics = async () => {
  try {
    const response = await api.get('/admin/statistics');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get top readers
export const getTopReaders = async (limit = 10) => {
  try {
    const response = await api.get('/admin/statistics/top-readers', { params: { limit } });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get top level users
export const getTopLevelUsers = async (limit = 10) => {
  try {
    const response = await api.get('/admin/statistics/top-levels', { params: { limit } });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};