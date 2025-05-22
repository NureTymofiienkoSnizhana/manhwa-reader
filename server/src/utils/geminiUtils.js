const axios = require('axios');
const config = require('../config/config');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

// Generate recommendations based on user reading history
const generateRecommendations = async (readManhwas) => {
  try {
    if (!readManhwas || readManhwas.length === 0) {
      return { error: 'No reading history available for recommendations' };
    }
    
    const prompt = `
      Based on the following manhwa/manga titles that the user has read:
      ${readManhwas.map(m => `- ${m.title} (${m.isLiked ? 'liked' : 'not liked'})`).join('\n')}
      
      Please recommend 5 manhwa/manga titles that the user might enjoy reading next. 
      For each recommendation, provide:
      - Title
      - Brief description (1-2 sentences)
      - Why the user might like it based on their reading history
      
      Format the response as a JSON array of objects, each with properties: title, description, and reason.
    `;
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${config.geminiApiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    
    const textResponse = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                     textResponse.match(/\[\n\s*\{[\s\S]*\}\n\s*\]/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing Gemini JSON response:', parseError);
        return { error: 'Could not parse recommendations', raw: textResponse };
      }
    }
    
    return { error: 'Could not generate structured recommendations', raw: textResponse };
    
  } catch (error) {
    console.error('Error generating recommendations with Gemini:', error.message);
    return { error: 'Failed to generate recommendations' };
  }
};

// Generate search suggestions
const generateSearchSuggestions = async (query, readManhwas = []) => {
  try {
    const prompt = `
      The user is searching for manhwa/manga with the query: "${query}"
      
      ${readManhwas.length > 0 ? 
        `They have previously read these titles:
        ${readManhwas.map(m => `- ${m.title}`).join('\n')}` : 
        'They have no reading history yet.'}
      
      Based on this information, suggest 5 search queries that might help the user find what they're looking for.
      Format the response as a JSON array of strings.
    `;
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${config.geminiApiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    
    const textResponse = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                     textResponse.match(/\[\n\s*"[\s\S]*"\n\s*\]/) ||
                     textResponse.match(/\[([\s\S]*?)\]/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing Gemini JSON response:', parseError);
        return { error: 'Could not parse suggestions', raw: textResponse };
      }
    }
    
    return { error: 'Could not generate search suggestions', raw: textResponse };
    
  } catch (error) {
    console.error('Error generating search suggestions with Gemini:', error.message);
    return { error: 'Failed to generate search suggestions' };
  }
};

module.exports = {
  generateRecommendations,
  generateSearchSuggestions
};