import api from './api';

// Get recommendations
export const getRecommendations = async () => {
  try {
    const response = await api.get('/recommendations');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get search suggestions
export const getSearchSuggestions = async (query) => {
  try {
    const response = await api.get('/recommendations/search-suggestions', {
      params: { query }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};