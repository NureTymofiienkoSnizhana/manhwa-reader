import api from './api';

// Get comments for a manhwa
export const getManhwaComments = async (manhwaId, page = 1, limit = 20, parentId = null) => {
  try {
    const response = await api.get(`/comments/${manhwaId}`, {
      params: { page, limit, parentId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { comments: [], pagination: { total: 0, pages: 0 } }; // Повертаємо порожній результат у випадку помилки
  }
};

// Create a new comment
export const createComment = async (manhwaId, content, parentId = null) => {
  try {
    const response = await api.post(`/comments/${manhwaId}`, {
      content,
      parentId
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Update a comment
export const updateComment = async (commentId, content) => {
  try {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Delete a comment
export const deleteComment = async (commentId) => {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Like/unlike a comment
export const toggleLikeComment = async (commentId) => {
  try {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};