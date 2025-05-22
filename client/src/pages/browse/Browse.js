import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { searchManhwas } from '../api/manhwaService';
import { getSearchSuggestions } from '../api/recommendationService';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';

const Browse = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [genre, setGenre] = useState(queryParams.get('genre') || '');
  const [status, setStatus] = useState(queryParams.get('status') || '');
  const [sortBy, setSortBy] = useState(queryParams.get('sort') || 'relevance');
  const [page, setPage] = useState(parseInt(queryParams.get('page') || '1'));
  const [showFilters, setShowFilters] = useState(false);
  
  const limit = 20;
  const offset = (page - 1) * limit;
  
  // Update search params in URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (genre) params.set('genre', genre);
    if (status) params.set('status', status);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (page > 1) params.set('page', page.toString());
    
    navigate({ search: params.toString() }, { replace: true });
  }, [searchQuery, genre, status, sortBy, page, navigate]);
  
  // Search manhwas
  const { data, isLoading, error } = useQuery(
    ['manhwaSearch', searchQuery, genre, status, sortBy, page],
    () => searchManhwas(searchQuery, limit, offset, {
      genre,
      status,
      order: { [sortBy]: 'desc' }
    }),
    { keepPreviousData: true }
  );
  
  // Get search suggestions
  const { data: suggestionsData } = useQuery(
    ['searchSuggestions', searchQuery],
    () => getSearchSuggestions(searchQuery),
    { 
      enabled: searchQuery.length > 2,
      staleTime: 60000 // 1 minute
    }
  );
  
  const suggestions = suggestionsData?.suggestions || [];
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };
  
  const handleGenreChange = (e) => {
    setGenre(e.target.value);
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
  
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
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
  
  return (
    <Container maxWidth="lg">
      {/* Page title */}
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ mb: 4, fontWeight: 600 }}
      >
        {t('nav.browse')}
      </Typography>
      
      {/* Search and filters section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('nav.search')}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Search suggestions */}
          {searchQuery.length > 2 && suggestions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {suggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  clickable
                  onClick={() => setSearchQuery(suggestion)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {t('common.filter')}:
          </Typography>
          <IconButton onClick={toggleFilters} color={showFilters ? 'primary' : 'default'}>
            <FilterIcon />
          </IconButton>
        </Box>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="genre-label">{t('manhwa.genre')}</InputLabel>
                    <Select
                      labelId="genre-label"
                      id="genre"
                      value={genre}
                      label={t('manhwa.genre')}
                      onChange={handleGenreChange}
                    >
                      <MenuItem value="">{t('common.all')}</MenuItem>
                      {['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Slice of Life'].map((g) => (
                        <MenuItem key={g} value={g}>{g}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">{t('manhwa.status')}</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
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
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="sort-label">{t('common.sort')}</InputLabel>
                    <Select
                      labelId="sort-label"
                      id="sort"
                      value={sortBy}
                      label={t('common.sort')}
                      onChange={handleSortChange}
                    >
                      <MenuItem value="relevance">{t('common.relevance')}</MenuItem>
                      <MenuItem value="latestUploadedChapter">{t('manhwa.latest')}</MenuItem>
                      <MenuItem value="followedCount">{t('manhwa.popular')}</MenuItem>
                      <MenuItem value="rating">{t('manhwa.rating')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
      
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
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="error" gutterBottom>
              {t('common.error')}
            </Typography>
            <Typography>
              {error.message || t('common.tryAgain')}
            </Typography>
          </Box>
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
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: 8
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={manhwa.coverImage || '/placeholder-cover.jpg'}
                        alt={manhwa.title}
                        height={320}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="div" noWrap>
                          {manhwa.title}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('manhwa.status')}: {manhwa.status}
                          </Typography>
                          {manhwa.author && (
                            <Typography variant="body2" color="text.secondary">
                              {t('manhwa.author')}: {manhwa.author}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {manhwa.tags?.slice(0, 3).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          component={RouterLink}
                          to={`/manhwa/${manhwa.id}`}
                        >
                          {t('common.view')}
                        </Button>
                      </CardActions>
                    </Card>
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
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('common.noResults')}
            </Typography>
            <Typography>
              {t('common.tryAgain')}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Browse;