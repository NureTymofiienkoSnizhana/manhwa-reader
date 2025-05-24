import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Paper,
  Autocomplete,
  Drawer,
  Button,
  Divider,
  Rating,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
  Collapse,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { searchManhwas } from '../../api/manhwaService';
import { getSearchSuggestions } from '../../api/recommendationService';
import { motion, AnimatePresence } from 'framer-motion';
import ManhwaCard from '../../components/common/ManhwaCard';

const SearchResults = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const queryParams = new URLSearchParams(location.search);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [tempSearchQuery, setTempSearchQuery] = useState(searchQuery);
  const [genres, setGenres] = useState(queryParams.get('genres')?.split(',') || []);
  const [status, setStatus] = useState(queryParams.get('status') || '');
  const [sortBy, setSortBy] = useState(queryParams.get('sort') || 'relevance');
  const [minRating, setMinRating] = useState(parseFloat(queryParams.get('minRating')) || 0);
  const [page, setPage] = useState(parseInt(queryParams.get('page') || '1'));
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const limit = 20;
  const offset = (page - 1) * limit;
  
  // Available genres
  const availableGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 
    'Thriller', 'Mystery', 'School', 'Historical', 'Military'
  ];
  
  // Update search params in URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (genres.length > 0) params.set('genres', genres.join(','));
    if (status) params.set('status', status);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (minRating > 0) params.set('minRating', minRating.toString());
    if (page > 1) params.set('page', page.toString());
    
    navigate({ search: params.toString() }, { replace: true });
  }, [searchQuery, genres, status, sortBy, minRating, page, navigate]);
  
  // Search manhwas
  const { data, isLoading, error } = useQuery(
    ['manhwaSearch', searchQuery, genres, status, sortBy, minRating, page],
    async () => {
      try {
        return await searchManhwas(searchQuery, limit, offset, {
          genres: genres.length > 0 ? genres : undefined,
          status,
          minRating: minRating > 0 ? minRating : undefined,
          order: { [sortBy]: 'desc' }
        });
      } catch (error) {
        // Return mock data if API fails
        return getMockSearchResults(searchQuery, genres, status);
      }
    },
    { 
      keepPreviousData: true,
      staleTime: 60000
    }
  );
  
  // Get search suggestions
  const { data: suggestionsData } = useQuery(
    ['searchSuggestions', tempSearchQuery],
    () => getSearchSuggestions(tempSearchQuery),
    { 
      enabled: tempSearchQuery.length > 2,
      staleTime: 300000
    }
  );
  
  useEffect(() => {
    if (suggestionsData?.suggestions) {
      setSuggestions(suggestionsData.suggestions);
    }
  }, [suggestionsData]);
  
  const handleSearchChange = (e) => {
    setTempSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(tempSearchQuery);
    setPage(1);
  };
  
  const handleSuggestionClick = (suggestion) => {
    setTempSearchQuery(suggestion);
    setSearchQuery(suggestion);
    setPage(1);
    setSuggestions([]);
  };
  
  const handleClearSearch = () => {
    setTempSearchQuery('');
    setSearchQuery('');
    setPage(1);
  };
  
  const handleGenreChange = (genre) => {
    const newGenres = genres.includes(genre)
      ? genres.filter(g => g !== genre)
      : [...genres, genre];
    setGenres(newGenres);
    setPage(1);
  };
  
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };
  
  const handleRatingChange = (event, newValue) => {
    setMinRating(newValue);
    setPage(1);
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };
  
  const handleClearFilters = () => {
    setGenres([]);
    setStatus('');
    setMinRating(0);
    setSortBy('relevance');
    setPage(1);
  };
  
  const hasActiveFilters = genres.length > 0 || status || minRating > 0;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const FiltersContent = () => (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{t('common.filter')}</Typography>
          <IconButton onClick={() => setShowFilters(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      
      {/* Status Filter */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="status-label">{t('manhwa.status')}</InputLabel>
        <Select
          labelId="status-label"
          value={status}
          label={t('manhwa.status')}
          onChange={handleStatusChange}
        >
          <MenuItem value="">{t('common.all')}</MenuItem>
          <MenuItem value="ongoing">{t('manhwa.ongoing')}</MenuItem>
          <MenuItem value="completed">{t('manhwa.completed')}</MenuItem>
          <MenuItem value="hiatus">{t('manhwa.hiatus')}</MenuItem>
        </Select>
      </FormControl>
      
      {/* Sort Filter */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="sort-label">{t('common.sort')}</InputLabel>
        <Select
          labelId="sort-label"
          value={sortBy}
          label={t('common.sort')}
          onChange={handleSortChange}
        >
          <MenuItem value="relevance">{t('common.relevance')}</MenuItem>
          <MenuItem value="latestUploadedChapter">{t('manhwa.latest')}</MenuItem>
          <MenuItem value="followedCount">{t('manhwa.popular')}</MenuItem>
          <MenuItem value="rating">{t('manhwa.rating')}</MenuItem>
          <MenuItem value="title">{t('library.title')}</MenuItem>
        </Select>
      </FormControl>
      
      {/* Rating Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>{t('manhwa.minRating')}</Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={minRating}
            onChange={handleRatingChange}
            step={0.5}
            marks
            min={0}
            max={5}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}★`}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Rating value={minRating} readOnly precision={0.5} size="small" />
          <Typography variant="body2" color="text.secondary">
            {minRating}★ і вище
          </Typography>
        </Box>
      </Box>
      
      {/* Genre Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('manhwa.genre')}
        </Typography>
        <FormGroup>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableGenres.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                clickable
                variant={genres.includes(genre) ? 'filled' : 'outlined'}
                color={genres.includes(genre) ? 'primary' : 'default'}
                onClick={() => handleGenreChange(genre)}
                size="small"
              />
            ))}
          </Box>
        </FormGroup>
      </Box>
      
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={handleClearFilters}
          fullWidth
        >
          {t('common.clearFilters')}
        </Button>
      )}
    </Box>
  );
  
  return (
    <Container maxWidth="lg">
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ mb: 4, fontWeight: 600 }}
      >
        {searchQuery ? `${t('common.searchResults')}: "${searchQuery}"` : t('common.search')}
      </Typography>
      
      {/* Search and filters section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t('nav.search')}
              value={tempSearchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: tempSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Search suggestions */}
            {tempSearchQuery.length > 2 && suggestions.length > 0 && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  mt: 1,
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderBottom: index < suggestions.length - 1 ? 1 : 0,
                      borderColor: 'divider'
                    }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Typography variant="body2">{suggestion}</Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(true)}
            variant={hasActiveFilters ? "contained" : "outlined"}
          >
            {t('common.filter')} {hasActiveFilters && `(${genres.length + (status ? 1 : 0) + (minRating > 0 ? 1 : 0)})`}
          </Button>
          
          {/* Active filters chips */}
          {hasActiveFilters && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {genres.map(genre => (
                <Chip
                  key={genre}
                  label={genre}
                  onDelete={() => handleGenreChange(genre)}
                  size="small"
                  color="primary"
                />
              ))}
              {status && (
                <Chip
                  label={t(`manhwa.${status}`)}
                  onDelete={() => setStatus('')}
                  size="small"
                  color="primary"
                />
              )}
              {minRating > 0 && (
                <Chip
                  label={`${minRating}★+`}
                  onDelete={() => setMinRating(0)}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Filters Drawer for Mobile */}
      <Drawer
        anchor="right"
        open={showFilters && isMobile}
        onClose={() => setShowFilters(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
          },
        }}
      >
        <FiltersContent />
      </Drawer>
      
      {/* Desktop Filters */}
      {!isMobile && (
        <Collapse in={showFilters}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FiltersContent />
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
      )}
      
      {/* Results */}
      <Box sx={{ mb: 4 }}>
        {isLoading ? (
          <Grid container spacing={3}>
            {Array.from(new Array(8)).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <Skeleton variant="rectangular" height={320} />
                  <CardContent>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('common.error')}: {error.message}
          </Alert>
        ) : data?.manga?.length > 0 ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              {t('common.showing')} {offset + 1}-{Math.min(offset + limit, data.total)} {t('common.of')} {data.total} {t('common.results')}
            </Typography>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Grid container spacing={3}>
                {data.manga.map((manhwa) => (
                  <Grid item xs={12} sm={6} md={3} key={manhwa.id} component={motion.div} variants={itemVariants}>
                    <ManhwaCard manhwa={manhwa} />
                  </Grid>
                ))}
              </Grid>
            </motion.div>
            
            {/* Pagination */}
            {data.total > limit && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(data.total / limit)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              {searchQuery ? t('common.noResults') : t('common.startSearch')}
            </Typography>
            <Typography color="text.secondary">
              {searchQuery ? t('common.tryDifferentKeywords') : t('common.searchPlaceholder')}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

// Mock search results
const getMockSearchResults = (query, genres, status) => {
  const mockResults = [
    {
      id: 'search-1',
      title: 'Solo Leveling',
      description: 'A weak hunter becomes the strongest.',
      coverImage: 'https://via.placeholder.com/300x400/4f46e5/ffffff?text=Solo+Leveling',
      status: 'completed',
      tags: ['Action', 'Fantasy', 'Adventure'],
      author: 'Chugong',
      rating: 4.8,
    },
    {
      id: 'search-2', 
      title: 'Tower of God',
      description: 'A boy enters a mysterious tower.',
      coverImage: 'https://via.placeholder.com/300x400/059669/ffffff?text=Tower+of+God',
      status: 'ongoing',
      tags: ['Action', 'Drama', 'Fantasy'],
      author: 'SIU',
      rating: 4.7,
    },
    {
      id: 'search-3',
      title: 'The Beginning After The End',
      description: 'A king reincarnated in a world of magic.',
      coverImage: 'https://via.placeholder.com/300x400/9333ea/ffffff?text=The+Beginning',
      status: 'ongoing',
      tags: ['Fantasy', 'Adventure', 'Magic'],
      author: 'TurtleMe',
      rating: 4.8,
    },
    {
      id: 'search-4',
      title: 'True Beauty',
      description: 'A girl transforms with makeup.',
      coverImage: 'https://via.placeholder.com/300x400/db2777/ffffff?text=True+Beauty',
      status: 'completed',
      tags: ['Romance', 'School', 'Drama'],
      author: 'Yaongyi',
      rating: 4.5,
    }
  ];
  
  // Filter by genres and status if provided
  let filtered = mockResults;
  
  if (genres.length > 0) {
    filtered = filtered.filter(manga => 
      manga.tags.some(tag => genres.includes(tag))
    );
  }
  
  if (status) {
    filtered = filtered.filter(manga => manga.status === status);
  }
  
  if (query) {
    filtered = filtered.filter(manga => 
      manga.title.toLowerCase().includes(query.toLowerCase()) ||
      manga.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  return {
    manga: filtered,
    total: filtered.length
  };
};

export default SearchResults;