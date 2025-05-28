import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  Divider,
  Badge,
  Rating,
  LinearProgress,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Snackbar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Star as StarIcon,
  Book as BookIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getUserReadingHistory } from '../../api/userService';
import { updateReadingProgress } from '../../api/manhwaService';
import { motion, AnimatePresence } from 'framer-motion';

const MyLibrary = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('reading');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedManhwa, setSelectedManhwa] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Available genres for filtering
  const availableGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Slice of Life'];
  
  // Fetch user reading history with all statuses
  const { data: allData, isLoading, error } = useQuery(
    ['readingHistory', 'all'],
    async () => {
      try {
        const [reading, completed, planToRead, dropped] = await Promise.all([
          getUserReadingHistory(1, 100, 'reading'),
          getUserReadingHistory(1, 100, 'completed'),
          getUserReadingHistory(1, 100, 'plan_to_read'),
          getUserReadingHistory(1, 100, 'dropped')
        ]);
        
        return {
          reading: reading.manhwas || [],
          completed: completed.manhwas || [],
          plan_to_read: planToRead.manhwas || [],
          dropped: dropped.manhwas || []
        };
      } catch (error) {
        return getMockLibraryData();
      }
    },
    { staleTime: 300000 }
  );
  
  // Mutation for updating reading progress
  const updateProgressMutation = useMutation(
    ({ manhwaId, progressData }) => updateReadingProgress(manhwaId, progressData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['readingHistory']);
        setSnackbar({
          open: true,
          message: data.message || t('common.success'),
          severity: 'success'
        });
        handleCloseMenu();
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.message || t('common.error'),
          severity: 'error'
        });
        handleCloseMenu();
      }
    }
  );
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  const handleViewModeChange = (event, newMode) => {
    if (newMode) setViewMode(newMode);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleGenreFilter = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };
  
  const clearGenreFilters = () => {
    setSelectedGenres([]);
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedRating(0);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedRating > 0 || searchQuery.length > 0;
  
  const handleMenuOpen = (event, manhwa) => {
    setAnchorEl(event.currentTarget);
    setSelectedManhwa(manhwa);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedManhwa(null);
  };
  
  const handleStatusChange = (status) => {
    if (selectedManhwa) {
      updateProgressMutation.mutate({
        manhwaId: selectedManhwa.manhwaId,
        progressData: { status }
      });
    }
  };
  
  const handleRemoveFromLibrary = () => {
    if (selectedManhwa) {
      updateProgressMutation.mutate({
        manhwaId: selectedManhwa.manhwaId,
        progressData: { status: 'removed' }
      });
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Filter and sort manhwas with improved genre filtering
  const getFilteredAndSortedManhwas = () => {
    const currentManhwas = allData?.[activeTab] || [];
    
    console.log('Current manhwas:', currentManhwas); // Debug
    console.log('Selected genres:', selectedGenres); // Debug
    
    // Apply search filter
    let filtered = currentManhwas.filter(manhwa => 
      manhwa.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    console.log('After search filter:', filtered); // Debug
    
    // Apply genre filter - improved logic
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(manhwa => {
        console.log('Checking manhwa:', manhwa.title, 'genres:', manhwa.genres); // Debug
        
        if (!manhwa.genres || manhwa.genres.length === 0) {
          console.log('No genres for', manhwa.title); // Debug
          return false;
        }
        
        // Check if any selected genre matches any manhwa genre
        const hasMatchingGenre = selectedGenres.some(selectedGenre => {
          return manhwa.genres.some(manhwaGenre => {
            const match = manhwaGenre.toLowerCase().trim() === selectedGenre.toLowerCase().trim();
            console.log('Comparing:', manhwaGenre, 'with', selectedGenre, '=', match); // Debug
            return match;
          });
        });
        
        console.log('Has matching genre for', manhwa.title, ':', hasMatchingGenre); // Debug
        return hasMatchingGenre;
      });
    }
    
    console.log('After genre filter:', filtered); // Debug
    
    // Apply rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(manhwa => (manhwa.rating || 0) >= selectedRating);
    }
    
    // Sort manhwas
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'lastChapterRead':
          return (b.lastChapterRead || 0) - (a.lastChapterRead || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'dateAdded':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default: // updatedAt
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
    });
  };
  
  const filteredManhwas = getFilteredAndSortedManhwas();
  
  // Get tab counts
  const getTabCounts = () => ({
    reading: allData?.reading?.length || 0,
    completed: allData?.completed?.length || 0,
    plan_to_read: allData?.plan_to_read?.length || 0,
    dropped: allData?.dropped?.length || 0
  });
  
  const tabCounts = getTabCounts();
  
  // Calculate reading progress for a manhwa
  const getReadingProgress = (manhwa) => {
    if (!manhwa.totalChapters || manhwa.totalChapters === 0) return 0;
    return Math.round((manhwa.lastChapterRead / manhwa.totalChapters) * 100);
  };
  
  // Render manhwa card based on view mode
  const renderManhwaCard = (manhwa, index) => {
    const progress = getReadingProgress(manhwa);
    
    if (viewMode === 'list') {
      return (
        <Card 
          key={manhwa.manhwaId}
          component={motion.div}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: index * 0.02 }}
          sx={{ 
            mb: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <CardMedia
              component="img"
              image={manhwa.coverImage || '/placeholder-cover.jpg'}
              alt={manhwa.title}
              sx={{ 
                width: 80, 
                height: 120, 
                objectFit: 'cover', 
                borderRadius: 2, 
                mr: 2, 
                flexShrink: 0,
                boxShadow: 2
              }}
            />
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap gutterBottom sx={{ fontWeight: 600 }}>
                {manhwa.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={manhwa.rating || 0} readOnly size="small" precision={0.5} />
                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  ({manhwa.rating || 0})
                </Typography>
              </Box>
              
              {activeTab === 'reading' && manhwa.totalChapters && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('library.readingProgress')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {manhwa.lastChapterRead || 0} / {manhwa.totalChapters} ({progress}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      }
                    }} 
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2">
                  {new Date(manhwa.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                component={RouterLink}
                to={`/manhwa/${manhwa.manhwaId}`}
                startIcon={<VisibilityIcon />}
              >
                {t('common.view')}
              </Button>
              
              {manhwa.lastChapterId && (
                <Button
                  size="small"
                  variant="contained"
                  component={RouterLink}
                  to={`/read/${manhwa.lastChapterId}`}
                  startIcon={<PlayArrowIcon />}
                >
                  {t('manhwa.continue')}
                </Button>
              )}
              
              <IconButton onClick={(e) => handleMenuOpen(e, manhwa)}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </Card>
      );
    }
    
    // Grid view with improved layout
    return (
      <Grid 
        size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
        key={manhwa.manhwaId}
        component={motion.div}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, delay: index * 0.02 }}
      >
        <Card 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: 12,
              '& .card-media': {
                transform: 'scale(1.05)'
              }
            }
          }}
        >
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <CardMedia
              className="card-media"
              component="img"
              image={manhwa.coverImage || '/placeholder-cover.jpg'}
              alt={manhwa.title}
              sx={{
                height: 240,
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
            />
            
            {manhwa.isLiked && (
              <Chip
                icon={<StarIcon sx={{ fontSize: '0.75rem !important' }} />}
                label={t('library.favorite')}
                color="secondary"
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  left: 10,
                  fontWeight: 600,
                  boxShadow: 2
                }}
              />
            )}
            
            {manhwa.isCompleted && (
              <Chip
                label={t('library.completed')}
                color="success"
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  fontWeight: 600,
                  boxShadow: 2
                }}
              />
            )}
            
            {activeTab === 'reading' && manhwa.lastChapterRead && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: 2
                }}
              >
                {t('manhwa.chapterNumber', { number: manhwa.lastChapterRead })}
              </Box>
            )}
          </Box>
          
          <CardContent sx={{ flexGrow: 1, p: 2 }}>
            <Typography 
              variant="h6" 
              component="div" 
              noWrap
              sx={{ 
                fontWeight: 600, 
                fontSize: '1rem',
                mb: 1,
                lineHeight: 1.3
              }}
            >
              {manhwa.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Rating value={manhwa.rating || 0} readOnly size="small" precision={0.5} />
              <Typography variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
                ({manhwa.rating || 0})
              </Typography>
            </Box>
            
            {activeTab === 'reading' && manhwa.totalChapters && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('library.chaptersProgress', { 
                    current: manhwa.lastChapterRead || 0, 
                    total: manhwa.totalChapters, 
                    percent: progress 
                  })}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                    }
                  }} 
                />
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon color="action" sx={{ mr: 0.5, fontSize: 14 }} />
              <Typography variant="caption" color="text.secondary">
                {new Date(manhwa.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
          
          <Divider />
          
          <CardActions sx={{ p: 2, pt: 1 }}>
            <Button 
              size="small" 
              component={RouterLink}
              to={`/manhwa/${manhwa.manhwaId}`}
              sx={{ fontSize: '0.75rem' }}
            >
              {t('common.view')}
            </Button>
            
            {manhwa.lastChapterId && (
              <Button 
                size="small" 
                component={RouterLink}
                to={`/read/${manhwa.lastChapterId}`}
                color="primary"
                variant="text"
                sx={{ fontSize: '0.75rem' }}
              >
                {t('manhwa.continue')}
              </Button>
            )}
            
            <Box sx={{ ml: 'auto' }}>
              <IconButton 
                size="small"
                onClick={(e) => handleMenuOpen(e, manhwa)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardActions>
        </Card>
      </Grid>
    );
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              className="gradient-text"
              sx={{ fontWeight: 700 }}
            >
              {t('nav.myLibrary')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('library.personalCollection')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="grid">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ListViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        
        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder={t('library.searchInLibrary')} 
              value={searchQuery}
              onChange={handleSearchChange}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('library.sortBy')}</InputLabel>
              <Select
                value={sortBy}
                label={t('library.sortBy')}
                onChange={handleSortChange}
              >
                <MenuItem value="updatedAt">{t('library.lastUpdated')}</MenuItem>
                <MenuItem value="title">{t('library.title')}</MenuItem>
                <MenuItem value="rating">{t('manhwa.rating')}</MenuItem>
                <MenuItem value="lastChapterRead">{t('library.lastChapter')}</MenuItem>
                <MenuItem value="dateAdded">{t('library.dateAdded')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Advanced Filters */}
          <Accordion 
            expanded={showFilters} 
            onChange={() => setShowFilters(!showFilters)}
            sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterListIcon sx={{ mr: 1 }} />
                  <Typography>{t('library.advancedFilters')}</Typography>
                </Box>
                {hasActiveFilters && (
                  <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                    {selectedGenres.length > 0 && (
                      <Chip 
                        label={t('library.genresCount', { count: selectedGenres.length })}
                        size="small" 
                        color="primary" 
                        variant="filled"
                      />
                    )}
                    {selectedRating > 0 && (
                      <Chip 
                        label={t('library.ratingFilter', { rating: selectedRating })}
                        size="small" 
                        color="secondary" 
                        variant="filled"
                      />
                    )}
                    {searchQuery && (
                      <Chip 
                        label={t('common.search')}
                        size="small" 
                        color="info" 
                        variant="filled"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('manhwa.genre')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {availableGenres.map(genre => (
                      <Chip
                        key={genre}
                        label={genre}
                        clickable
                        variant={selectedGenres.includes(genre) ? 'filled' : 'outlined'}
                        color={selectedGenres.includes(genre) ? 'primary' : 'default'}
                        onClick={() => handleGenreFilter(genre)}
                        size="small"
                        sx={{
                          fontWeight: selectedGenres.includes(genre) ? 600 : 400,
                          '&:hover': {
                            transform: 'scale(1.05)',
                            transition: 'transform 0.2s'
                          }
                        }}
                      />
                    ))}
                  </Box>
                  {selectedGenres.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" onClick={clearGenreFilters} color="secondary" variant="outlined">
                        {t('library.clearGenres')}
                      </Button>
                    </Box>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('library.minimumRating')}
                  </Typography>
                  <Rating
                    value={selectedRating}
                    onChange={(event, newValue) => setSelectedRating(newValue || 0)}
                    precision={0.5}
                    size="large"
                  />
                  {selectedRating > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('library.ratingAndAbove', { rating: selectedRating })}
                    </Typography>
                  )}
                </Grid>
              </Grid>
              
              {hasActiveFilters && (
                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button 
                    size="small" 
                    onClick={clearAllFilters} 
                    color="error" 
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                  >
                    {t('common.clearFilters')}
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }
            }}
          >
            <Tab 
              value="reading" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('library.reading')}
                  <Chip label={tabCounts.reading} size="small" color="primary" />
                </Box>
              } 
            />
            <Tab 
              value="completed" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('library.completed')}
                  <Chip label={tabCounts.completed} size="small" color="success" />
                </Box>
              } 
            />
            <Tab 
              value="plan_to_read" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('library.planToRead')}
                  <Chip label={tabCounts.plan_to_read} size="small" color="info" />
                </Box>
              } 
            />
            <Tab 
              value="dropped" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('library.dropped')}
                  <Chip label={tabCounts.dropped} size="small" color="warning" />
                </Box>
              } 
            />
          </Tabs>
        </Box>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <Grid container spacing={3}>
              {Array.from(new Array(8)).map((_, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                  <Card sx={{ borderRadius: 3 }}>
                    <Skeleton variant="rectangular" height={240} />
                    <CardContent>
                      <Skeleton variant="text" height={24} />
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : filteredManhwas.length > 0 ? (
            <Box>
              {viewMode === 'grid' ? (
                <Grid container spacing={3}>
                  {filteredManhwas.map((manhwa, index) => renderManhwaCard(manhwa, index))}
                </Grid>
              ) : (
                <Box>
                  {filteredManhwas.map((manhwa, index) => renderManhwaCard(manhwa, index))}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {searchQuery || selectedGenres.length > 0 || selectedRating > 0 
                  ? t('common.noResults')
                  : t('library.noManhwas')
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {searchQuery || selectedGenres.length > 0 || selectedRating > 0
                  ? t('library.tryDifferentFilters')
                  : t('library.addSome')
                }
              </Typography>
              {!searchQuery && selectedGenres.length === 0 && selectedRating === 0 && (
                <Button 
                  variant="contained" 
                  component={RouterLink}
                  to="/browse"
                  size="large"
                >
                  {t('library.browseManhwa')}
                </Button>
              )}
            </Box>
          )}
        </AnimatePresence>
        
        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem 
            component={RouterLink}
            to={selectedManhwa ? `/read/${selectedManhwa.lastChapterId || ''}` : '#'}
            onClick={handleCloseMenu}
            disabled={!selectedManhwa?.lastChapterId}
          >
            <PlayArrowIcon sx={{ mr: 1 }} />
            {t('manhwa.continueReading')}
          </MenuItem>
          
          <MenuItem 
            component={RouterLink}
            to={selectedManhwa ? `/manhwa/${selectedManhwa.manhwaId}` : '#'}
            onClick={handleCloseMenu}
          >
            <VisibilityIcon sx={{ mr: 1 }} />
            {t('manhwa.details')}
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={() => handleStatusChange('reading')}>
            {t('library.moveToReading')}
          </MenuItem>
          
          <MenuItem onClick={() => handleStatusChange('completed')}>
            {t('library.moveToCompleted')}
          </MenuItem>
          
          <MenuItem onClick={() => handleStatusChange('plan_to_read')}>
            {t('library.moveToPlanToRead')}
          </MenuItem>
          
          <MenuItem onClick={() => handleStatusChange('dropped')}>
            {t('library.moveToDropped')}
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleRemoveFromLibrary} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            {t('common.remove')}
          </MenuItem>
        </Menu>
        
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

// Mock library data
const getMockLibraryData = () => ({
  reading: [
    {
      manhwaId: 'solo-leveling',
      title: 'Solo Leveling',
      coverImage: 'https://via.placeholder.com/300x400/4f46e5/ffffff?text=Solo+Leveling',
      rating: 5,
      lastChapterRead: 45,
      totalChapters: 110,
      lastChapterId: 'ch-45',
      isLiked: true,
      genres: ['Action', 'Fantasy'],
      updatedAt: new Date().toISOString(),
      createdAt: '2023-01-15T00:00:00.000Z'
    },
    {
      manhwaId: 'tower-of-god',
      title: 'Tower of God',
      coverImage: 'https://via.placeholder.com/300x400/059669/ffffff?text=Tower+of+God',
      rating: 4.5,
      lastChapterRead: 120,
      totalChapters: 500,
      lastChapterId: 'ch-120',
      isLiked: true,
      genres: ['Action', 'Adventure'],
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: '2023-02-01T00:00:00.000Z'
    },
    {
      manhwaId: 'the-beginning-after-the-end',
      title: 'The Beginning After The End',
      coverImage: 'https://via.placeholder.com/300x400/9333ea/ffffff?text=Beginning',
      rating: 4.8,
      lastChapterRead: 80,
      totalChapters: 150,
      lastChapterId: 'ch-80',
      isLiked: false,
      genres: ['Fantasy', 'Adventure'],
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      createdAt: '2023-03-01T00:00:00.000Z'
    }
  ],
  completed: [
    {
      manhwaId: 'noblesse',
      title: 'Noblesse',
      coverImage: 'https://via.placeholder.com/300x400/7c3aed/ffffff?text=Noblesse',
      rating: 4.2,
      lastChapterRead: 544,
      totalChapters: 544,
      lastChapterId: 'ch-544',
      isLiked: true,
      isCompleted: true,
      genres: ['Action', 'Supernatural'],
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
      createdAt: '2022-12-01T00:00:00.000Z'
    },
    {
      manhwaId: 'god-of-high-school',
      title: 'The God of High School',
      coverImage: 'https://via.placeholder.com/300x400/dc2626/ffffff?text=God+School',
      rating: 4.0,
      lastChapterRead: 516,
      totalChapters: 516,
      lastChapterId: 'ch-516',
      isLiked: false,
      isCompleted: true,
      genres: ['Action', 'Comedy'],
      updatedAt: new Date(Date.now() - 345600000).toISOString(),
      createdAt: '2022-10-15T00:00:00.000Z'
    }
  ],
  plan_to_read: [
    {
      manhwaId: 'eleceed',
      title: 'Eleceed',
      coverImage: 'https://via.placeholder.com/300x400/0d9488/ffffff?text=Eleceed',
      rating: 0,
      lastChapterRead: 0,
      totalChapters: 250,
      genres: ['Action', 'Comedy'],
      updatedAt: new Date(Date.now() - 432000000).toISOString(),
      createdAt: '2023-04-01T00:00:00.000Z'
    },
    {
      manhwaId: 'omniscient-reader',
      title: 'Omniscient Reader\'s Viewpoint',
      coverImage: 'https://via.placeholder.com/300x400/1e40af/ffffff?text=Omniscient',
      rating: 0,
      lastChapterRead: 0,
      totalChapters: 180,
      genres: ['Fantasy', 'Drama'],
      updatedAt: new Date(Date.now() - 518400000).toISOString(),
      createdAt: '2023-05-01T00:00:00.000Z'
    }
  ],
  dropped: [
    {
      manhwaId: 'weak-hero',
      title: 'Weak Hero',
      coverImage: 'https://via.placeholder.com/300x400/991b1b/ffffff?text=Weak+Hero',
      rating: 2.5,
      lastChapterRead: 25,
      totalChapters: 200,
      lastChapterId: 'ch-25',
      isLiked: false,
      genres: ['Action', 'School'],
      updatedAt: new Date(Date.now() - 604800000).toISOString(),
      createdAt: '2023-01-20T00:00:00.000Z'
    }
  ]
});

export default MyLibrary;