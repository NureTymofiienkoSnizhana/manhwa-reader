import api from './api';

// Get all users (admin only)
export const getAllUsers = async (page = 1, limit = 20, search = '') => {
  try {
    const params = { page, limit };
    if (search) params.search = search;
    
    const response = await api.get('/admin/users', { params });
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