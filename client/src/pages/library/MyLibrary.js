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
  const [viewMode, setViewMode] = useState('grid'); // grid или list
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
        // Fetch different statuses
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
  
  // Filter and sort manhwas
  const getFilteredAndSortedManhwas = () => {
    const currentManhwas = allData?.[activeTab] || [];
    
    // Apply search filter
    let filtered = currentManhwas.filter(manhwa => 
      manhwa.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Apply genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(manhwa => 
        manhwa.genres?.some(genre => selectedGenres.includes(genre))
      );
    }
    
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
          transition={{ duration: 0.3, delay: index * 0.05 }}
          sx={{ mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <CardMedia
              component="img"
              image={manhwa.coverImage || '/placeholder-cover.jpg'}
              alt={manhwa.title}
              sx={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 1, mr: 2, flexShrink: 0 }}
            />
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap gutterBottom>
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
                      Прогрес читання
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {manhwa.lastChapterRead || 0} / {manhwa.totalChapters} ({progress}%)
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
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
    
    // Grid view
    return (
      <Grid 
        item 
        xs={12} 
        sm={6} 
        md={4}
        lg={3}
        key={manhwa.manhwaId}
        component={motion.div}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
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
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              image={manhwa.coverImage || '/placeholder-cover.jpg'}
              alt={manhwa.title}
              height={200}
              sx={{ objectFit: 'cover' }}
            />
            
            {manhwa.isLiked && (
              <Chip
                label={t('common.like')}
                color="secondary"
                size="small"
                sx={{ position: 'absolute', top: 10, left: 10 }}
              />
            )}
            
            {manhwa.isCompleted && (
              <Chip
                label={t('library.completed')}
                color="success"
                size="small"
                sx={{ position: 'absolute', top: 10, right: 10 }}
              />
            )}
            
            {activeTab === 'reading' && manhwa.lastChapterRead && (
              <Badge
                badgeContent={manhwa.lastChapterRead}
                color="primary"
                max={999}
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: '22px',
                    minWidth: '22px',
                  }
                }}
              />
            )}
          </Box>
          
          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
            <Typography 
              gutterBottom 
              variant="h6" 
              component="div" 
              noWrap
              sx={{ fontWeight: 600, fontSize: '1rem' }}
            >
              {manhwa.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating value={manhwa.rating || 0} readOnly size="small" precision={0.5} />
              <Typography variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
                ({manhwa.rating || 0})
              </Typography>
            </Box>
            
            {activeTab === 'reading' && manhwa.totalChapters && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {manhwa.lastChapterRead || 0} / {manhwa.totalChapters} глав ({progress}%)
                </Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 4, borderRadius: 2 }} />
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <AccessTimeIcon color="action" sx={{ mr: 1, fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                {new Date(manhwa.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
          
          <Divider />
          
          <CardActions sx={{ pt: 1 }}>
            <Button 
              size="small" 
              component={RouterLink}
              to={`/manhwa/${manhwa.manhwaId}`}
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
              Ваша персональна колекція манги
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
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder={t('common.searchInLibrary')}
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
                <MenuItem value="lastChapterRead">{t('manhwa.lastRead')}</MenuItem>
                <MenuItem value="dateAdded">{t('library.dateAdded')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Advanced Filters */}
          <Accordion expanded={showFilters} onChange={() => setShowFilters(!showFilters)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterListIcon sx={{ mr: 1 }} />
                <Typography>{t('common.advancedFilters')}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('manhwa.genre')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableGenres.map(genre => (
                      <Chip
                        key={genre}
                        label={genre}
                        clickable
                        variant={selectedGenres.includes(genre) ? 'filled' : 'outlined'}
                        color={selectedGenres.includes(genre) ? 'primary' : 'default'}
                        onClick={() => handleGenreFilter(genre)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('manhwa.minRating')}
                  </Typography>
                  <Rating
                    value={selectedRating}
                    onChange={(event, newValue) => setSelectedRating(newValue)}
                    precision={0.5}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Paper>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
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
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" />
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
                {searchQuery ? t('common.noResults') : t('library.noManhwas')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {searchQuery ? t('common.tryDifferentKeywords') : t('library.addSome')}
              </Typography>
              {!searchQuery && (
                <Button 
                  variant="contained" 
                  component={RouterLink}
                  to="/browse"
                  size="large"
                >
                  {t('nav.browse')}
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
            {t('manhwa.continue')}
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
      rating: 4,
      lastChapterRead: 120,
      totalChapters: 500,
      lastChapterId: 'ch-120',
      isLiked: true,
      genres: ['Action', 'Adventure'],
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: '2023-02-01T00:00:00.000Z'
    }
  ],
  completed: [
    {
      manhwaId: 'noblesse',
      title: 'Noblesse',
      coverImage: 'https://via.placeholder.com/300x400/7c3aed/ffffff?text=Noblesse',
      rating: 4,
      lastChapterRead: 544,
      totalChapters: 544,
      lastChapterId: 'ch-544',
      isLiked: true,
      isCompleted: true,
      genres: ['Action', 'Supernatural'],
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      createdAt: '2022-12-01T00:00:00.000Z'
    }
  ],
  plan_to_read: [
    {
      manhwaId: 'eleceed',
      title: 'Eleceed',
      coverImage: 'https://via.placeholder.com/300x400/0d9488/ffffff?text=Eleceed',
      rating: 0,
      lastChapterRead: 0,
      totalChapters: 200,
      genres: ['Action', 'Comedy'],
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
      createdAt: '2023-03-01T00:00:00.000Z'
    }
  ],
  dropped: []
});

export default MyLibrary;