const axios = require('axios');
const config = require('../config/config');

const mangadexApi = axios.create({
  baseURL: config.mangadexApiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Get manga by ID
const getMangaById = async (mangaId) => {
  try {
    const response = await mangadexApi.get(`/manga/${mangaId}?includes[]=cover_art&includes[]=author`);
    return formatMangaResponse(response.data.data);
  } catch (error) {
    console.error('Error fetching manga from MangaDex:', error.message);
    throw error;
  }
};

// Search manga
const searchManga = async (query, limit = 20, offset = 0) => {
  try {
    const response = await mangadexApi.get('/manga', {
      params: {
        title: query,
        limit,
        offset,
        includes: ['cover_art', 'author'],
        contentRating: ['safe', 'suggestive'],
        order: { relevance: 'desc' }
      }
    });
    
    return {
      total: response.data.total,
      manga: response.data.data.map(formatMangaResponse)
    };
  } catch (error) {
    console.error('Error searching manga from MangaDex:', error.message);
    throw error;
  }
};

// Get manga chapters
const getMangaChapters = async (mangaId, lang = 'en', limit = 100, offset = 0) => {
  try {
    const response = await mangadexApi.get('/chapter', {
      params: {
        manga: mangaId,
        translatedLanguage: [lang],
        limit,
        offset,
        order: { chapter: 'asc' }
      }
    });
    
    return {
      total: response.data.total,
      chapters: response.data.data.map(formatChapterResponse)
    };
  } catch (error) {
    console.error('Error fetching chapters from MangaDex:', error.message);
    throw error;
  }
};

// Get chapter pages
const getChapterPages = async (chapterId) => {
  try {
    const response = await mangadexApi.get(`/at-home/server/${chapterId}`);
    const baseUrl = response.data.baseUrl;
    const chapter = response.data.chapter;
    
    // Use data-saver for bandwidth efficiency
    const pages = chapter.dataSaver.map(page => 
      `${baseUrl}/data-saver/${chapter.hash}/${page}`
    );
    
    return { 
      pages,
      // Include full quality option as well
      pagesHQ: chapter.data.map(page => 
        `${baseUrl}/data/${chapter.hash}/${page}`
      )
    };
  } catch (error) {
    console.error('Error fetching chapter pages from MangaDex:', error.message);
    throw error;
  }
};

// Helper function to format manga response
const formatMangaResponse = (manga) => {
  const coverFile = manga.relationships.find(rel => rel.type === 'cover_art')?.attributes?.fileName;
  const author = manga.relationships.find(rel => rel.type === 'author')?.attributes?.name;
  
  return {
    id: manga.id,
    title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
    description: manga.attributes.description.en || Object.values(manga.attributes.description)[0] || '',
    coverImage: coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}` : null,
    status: manga.attributes.status,
    tags: manga.attributes.tags.map(tag => tag.attributes.name.en),
    author: author || 'Unknown',
    rating: manga.attributes.contentRating,
    lastUpdated: manga.attributes.updatedAt
  };
};

// Helper function to format chapter response
const formatChapterResponse = (chapter) => {
  return {
    id: chapter.id,
    chapter: chapter.attributes.chapter,
    title: chapter.attributes.title,
    pages: chapter.attributes.pages,
    publishedAt: chapter.attributes.publishAt,
    volume: chapter.attributes.volume,
    language: chapter.attributes.translatedLanguage
  };
};

module.exports = {
  getMangaById,
  searchManga,
  getMangaChapters,
  getChapterPages
};