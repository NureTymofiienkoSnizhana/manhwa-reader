const axios = require('axios');
const config = require('../config/config');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

// Функция для получения рекомендаций на основе истории чтения пользователя
const generateRecommendations = async (readManhwas) => {
  try {
    // Проверка API ключа
    if (!config.geminiApiKey) {
      console.log("Gemini API key is not configured, using fallback recommendations");
      return getFallbackRecommendations(readManhwas);
    }

    if (!readManhwas || readManhwas.length === 0) {
      return getFallbackRecommendations();
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
    
    try {
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
          return getFallbackRecommendations(readManhwas);
        }
      }
      
      return getFallbackRecommendations(readManhwas);
      
    } catch (error) {
      console.error('Error generating recommendations with Gemini:', error.message);
      return getFallbackRecommendations(readManhwas);
    }
  } catch (error) {
    console.error('Error in generateRecommendations:', error.message);
    return getFallbackRecommendations(readManhwas);
  }
};

// Функция для получения предложений поиска
const generateSearchSuggestions = async (query, readManhwas = []) => {
  try {
    // Проверка API ключа
    if (!config.geminiApiKey) {
      console.log("Gemini API key is not configured, using fallback search suggestions");
      return getFallbackSearchSuggestions(query);
    }
    
    const prompt = `
      The user is searching for manhwa/manga with the query: "${query}"
      
      ${readManhwas.length > 0 ? 
        `They have previously read these titles:
        ${readManhwas.map(m => `- ${m.title}`).join('\n')}` : 
        'They have no reading history yet.'}
      
      Based on this information, suggest 5 search queries that might help the user find what they're looking for.
      Format the response as a JSON array of strings.
    `;
    
    try {
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
          return getFallbackSearchSuggestions(query);
        }
      }
      
      return getFallbackSearchSuggestions(query);
      
    } catch (error) {
      console.error('Error generating search suggestions with Gemini:', error.message);
      return getFallbackSearchSuggestions(query);
    }
  } catch (error) {
    console.error('Error in generateSearchSuggestions:', error.message);
    return getFallbackSearchSuggestions(query);
  }
};

// Функция для получения резервных рекомендаций, когда Gemini недоступен
const getFallbackRecommendations = (readManhwas = []) => {
  // Базовые рекомендации
  const baseRecommendations = [
    {
      title: "Solo Leveling",
      description: "A hunter with the weakest abilities suddenly gains incredible powers after a mysterious encounter in a dungeon.",
      reason: "Popular action series with great character development",
      coverImage: "https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/d22a838b-78f9-4354-ae7c-aab9561d6360.jpg"
    },
    {
      title: "The Beginning After The End",
      description: "A powerful king is reincarnated into a new world filled with magic and monsters.",
      reason: "Exciting fantasy story with beautiful artwork",
      coverImage: "https://uploads.mangadex.org/covers/6a486c11-ab14-444a-b0f0-999ec1d7d0a6/94ea948c-c7a7-48f3-a898-20ea41d2d723.jpg"
    },
    {
      title: "Tower of God",
      description: "A boy enters a mysterious tower to chase after his friend who disappeared there.",
      reason: "Complex world-building and intriguing character relationships",
      coverImage: "https://uploads.mangadex.org/covers/4923deaa-34e2-4904-91dc-5a8641384cc4/fe6d79ff-1011-4e3a-9e70-f9d34b744616.jpg"
    },
    {
      title: "The God of High School",
      description: "Martial arts tournament turns into a battle between gods and demons.",
      reason: "Amazing fight scenes and supernatural elements",
      coverImage: "https://uploads.mangadex.org/covers/f37d5cf1-d0b7-409f-90a4-5e4da47b0235/5f26d569-c420-48ac-8222-dc42ddef4311.jpg"
    },
    {
      title: "Sweet Home",
      description: "People transform into monsters based on their deepest desires in this apocalyptic story.",
      reason: "Thrilling horror series with psychological elements",
      coverImage: "https://uploads.mangadex.org/covers/f5920562-3f66-4d80-92ef-d928d03cb3b2/3ed1fb1e-4ad0-4e2f-a8a9-f5d7d41b215b.jpg"
    }
  ];

  return baseRecommendations;
};

// Функция для получения резервных предложений поиска
const getFallbackSearchSuggestions = (query) => {
  // Базовые предложения для популярных жанров
  const baseGenres = ["action", "romance", "fantasy", "comedy", "drama", "horror", "school", "adventure"];
  
  // Если запрос содержит одно из базовых слов, предложим комбинации
  const matchingGenres = baseGenres.filter(genre => 
    query.toLowerCase().includes(genre) || genre.includes(query.toLowerCase())
  );
  
  if (matchingGenres.length > 0) {
    const primaryGenre = matchingGenres[0];
    // Создаем комбинации жанров
    return baseGenres
      .filter(genre => genre !== primaryGenre)
      .slice(0, 4)
      .map(genre => `${primaryGenre} ${genre}`)
      .concat([`best ${primaryGenre} manhwa`]);
  }
  
  // Если нет совпадений, предлагаем стандартные варианты
  return [
    `${query} manhwa`,
    `best ${query} comics`,
    `popular ${query} series`,
    `${query} webtoon recommendations`,
    `${query} similar to Solo Leveling`
  ];
};

module.exports = {
  generateRecommendations,
  generateSearchSuggestions
};