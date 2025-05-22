import api from './api';

// Search manhwas
export const searchManhwas = async (query = '', limit = 20, offset = 0, options = {}) => {
  try {
    // For empty queries, use a default search term or change the endpoint
    const actualQuery = query || 'popular'; // Use 'popular' as default query for empty strings
    
    const response = await api.get('/manhwa/search', {
      params: { 
        query: actualQuery, 
        limit, 
        offset,
        ...options 
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching manhwas:', error);
    // Return empty results instead of throwing error
    return { manga: [], total: 0 };
  }
};

// Get manhwa details
export const getManhwaDetails = async (manhwaId) => {
  try {
    const response = await api.get(`/manhwa/${manhwaId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get manhwa chapters
export const getManhwaChapters = async (manhwaId, lang = 'en', limit = 100, offset = 0) => {
  try {
    const response = await api.get(`/manhwa/${manhwaId}/chapters`, {
      params: { lang, limit, offset }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get chapter content
export const getChapterContent = async (chapterId) => {
  try {
    const response = await api.get(`/manhwa/chapter/${chapterId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Update reading progress
export const updateReadingProgress = async (manhwaId, progressData) => {
  try {
    const response = await api.post(`/manhwa/${manhwaId}/progress`, progressData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};