import api from './api';

// Get all users 
export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    console.error('getUsers error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Update user role
export const updateUserRole = async (userId, role) => {
  try {
    console.log('updateUserRole called with:', { userId, role });
    const response = await api.put('/admin/users/role', { userId, role });
    return response.data;
  } catch (error) {
    console.error('updateUserRole error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    console.log('deleteUser called with:', userId);
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('deleteUser error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Unban user
export const unbanUser = async (userId) => {
  try {
    console.log('unbanUser called with:', userId);
    const response = await api.delete(`/admin/ban/${userId}`);
    return response.data;
  } catch (error) {
    console.error('unbanUser error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Search users by query
export const searchUsers = async (query) => {
  try {
    const response = await api.get('/admin/users/search', { params: { query } });
    return response.data;
  } catch (error) {
    console.error('searchUsers error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get level tasks
export const getLevelTasks = async () => {
  try {
    const response = await api.get('/admin/level-tasks');
    return response.data;
  } catch (error) {
    console.error('getLevelTasks error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Create or update level task
export const updateLevelTask = async (level, taskData) => {
  try {
    const response = await api.post(`/admin/level-tasks/${level}`, taskData);
    return response.data;
  } catch (error) {
    console.error('updateLevelTask error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Delete level task
export const deleteLevelTask = async (level) => {
  try {
    const response = await api.delete(`/admin/level-tasks/${level}`);
    return response.data;
  } catch (error) {
    console.error('deleteLevelTask error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get active bans
export const getActiveBans = async () => {
  try {
    const response = await api.get('/admin/bans/active');
    return response.data;
  } catch (error) {
    console.error('getActiveBans error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get ban history
export const getBanHistory = async () => {
  try {
    const response = await api.get('/admin/bans/history');
    return response.data;
  } catch (error) {
    console.error('getBanHistory error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Ban user
export const banUser = async (banData) => {
  try {
    console.log('banUser called with:', banData);
    const response = await api.post('/admin/ban', banData);
    return response.data;
  } catch (error) {
    console.error('banUser error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get platform statistics
export const getPlatformStatistics = async () => {
  try {
    const response = await api.get('/admin/statistics');
    return response.data;
  } catch (error) {
    console.error('getPlatformStatistics error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get top readers
export const getTopReaders = async (limit = 10) => {
  try {
    const response = await api.get('/admin/statistics/top-readers', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('getTopReaders error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get top level users
export const getTopLevelUsers = async (limit = 10) => {
  try {
    const response = await api.get('/admin/statistics/top-levels', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('getTopLevelUsers error:', error);
    throw error.response ? error.response.data : new Error('Server error');
  }
};