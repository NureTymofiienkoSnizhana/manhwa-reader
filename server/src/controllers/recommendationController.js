const ManhwaProgress = require('../models/ManhwaProgress');
const { 
  generateRecommendations, 
  generateSearchSuggestions 
} = require('../utils/geminiUtils');
const { searchManga } = require('../utils/mangadexUtils');

// Get personalized recommendations
const getRecommendations = async (req, res, next) => {
  try {
    // Get user's reading history
    const userReading = await ManhwaProgress.find({ 
      user: req.user.id 
    }).sort({ updatedAt: -1 }).limit(20);
    
    if (userReading.length === 0) {
      // User has no reading history, fetch popular manhwa
      const popular = await searchManga('', 10, 0, {
        order: { followedCount: 'desc' }
      });
      
      return res.json({
        recommendations: popular.manga.map(m => ({
          title: m.title,
          description: m.description?.slice(0, 100) + '...',
          reason: 'Popular series you might enjoy',
          id: m.id,
          coverImage: m.coverImage
        })),
        message: 'Popular recommendations for new readers'
      });
    }
    
    // Generate recommendations using Gemini
    const aiRecommendations = await generateRecommendations(userReading);
    
    if (aiRecommendations.error) {
      return res.status(500).json({ message: 'Failed to generate recommendations', error: aiRecommendations.error });
    }
    
    // Get detailed info about recommended manhwa
    const enhancedRecommendations = [];
    
    for (const rec of aiRecommendations) {
      try {
        // Search for the recommended title
        const searchResult = await searchManga(rec.title, 1);
        
        if (searchResult.total > 0) {
          const manga = searchResult.manga[0];
          enhancedRecommendations.push({
            ...rec,
            id: manga.id,
            coverImage: manga.coverImage
          });
        } else {
          // If no search results, include recommendation without cover
          enhancedRecommendations.push(rec);
        }
      } catch (error) {
        console.error(`Error enhancing recommendation for ${rec.title}:`, error.message);
        // Include original recommendation if enhancement fails
        enhancedRecommendations.push(rec);
      }
    }
    
    res.json({
      recommendations: enhancedRecommendations,
      message: 'Personalized recommendations based on your reading history'
    });
  } catch (error) {
    next(error);
  }
};

// Get search suggestions
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    // Get user's reading history if available
    let userReading = [];
    if (req.user) {
      userReading = await ManhwaProgress.find({ 
        user: req.user.id 
      }).sort({ updatedAt: -1 }).limit(10);
    }
    
    // Generate search suggestions using Gemini
    const suggestions = await generateSearchSuggestions(query, userReading);
    
    if (suggestions.error) {
      return res.status(500).json({ message: 'Failed to generate suggestions', error: suggestions.error });
    }
    
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getSearchSuggestions
};