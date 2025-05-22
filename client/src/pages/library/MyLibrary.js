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
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getUserReadingHistory } from '../../api/userService';
import { updateReadingProgress } from '../../api/manhwaService';
import { useNotification } from '../../hooks/useNotification';
import { motion, AnimatePresence } from 'framer-motion';

const MyLibrary = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('reading');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedManhwa, setSelectedManhwa] = useState(null);
  
  // Fetch user reading history
  const { data, isLoading, error } = useQuery(
    ['readingHistory', activeTab],
    () => getUserReadingHistory(1, 100, activeTab),
    { staleTime: 300000 } // 5 minutes
  );
  
  // Mutation for updating reading progress
  const updateProgressMutation = useMutation(
    ({ manhwaId, progressData }) => updateReadingProgress(manhwaId, progressData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['readingHistory']);
        showSuccess(t('common.progressUpdated'));
        handleCloseMenu();
      },
      onError: (error) => {
        showError(error.message || t('common.error'));
        handleCloseMenu();
      }
    }
  );
  
  // Mutation for removing from library
  const removeFromLibraryMutation = useMutation(
    (manhwaId) => updateReadingProgress(manhwaId, { status: 'removed' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['readingHistory']);
        showSuccess(t('common.removed'));
        handleCloseMenu();
      },
      onError: (error) => {
        showError(error.message || t('common.error'));
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
      removeFromLibraryMutation.mutate(selectedManhwa.manhwaId);
    }
  };
  
  // Sort manhwas
  const sortManhwas = (manhwas) => {
    if (!manhwas) return [];
    
    return [...manhwas].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'lastChapterRead') {
        return b.lastChapterRead - a.lastChapterRead;
      } else {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });
  };
  
  const sortedManhwas = sortManhwas(data?.manhwas);
  
  return (
    <Container maxWidth="lg">
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ mb: 4, fontWeight: 600 }}
      >
        {t('nav.myLibrary')}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="library tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="reading" label={t('library.reading')} />
          <Tab value="completed" label={t('library.completed')} />
          <Tab value="plan_to_read" label={t('library.planToRead')} />
          <Tab value="dropped" label={t('library.dropped')} />
        </Tabs>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="sort-by-label">{t('library.sortBy')}</InputLabel>
          <Select
            labelId="sort-by-label"
            id="sort-by"
            value={sortBy}
            label={t('library.sortBy')}
            onChange={handleSortChange}
            size="small"
          >
            <MenuItem value="updatedAt">{t('library.lastUpdated')}</MenuItem>
            <MenuItem value="title">{t('library.title')}</MenuItem>
            <MenuItem value="lastChapterRead">{t('manhwa.lastRead')}</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {isLoading ? (
            <Grid container spacing={3}>
              {Array.from(new Array(8)).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
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
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="error" gutterBottom>
                {t('common.error')}
              </Typography>
              <Typography>
                {error.message || t('common.tryAgain')}
              </Typography>
            </Box>
          ) : sortedManhwas?.length > 0 ? (
            <Grid container spacing={3}>
              {sortedManhwas.map((manhwa) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={3} 
                  key={manhwa.manhwaId}
                  component={motion.div}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}>
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
                          sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                          }}
                        />
                      )}
                      
                      {activeTab === 'reading' && (
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
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div" noWrap>
                        {manhwa.title}
                      </Typography>
                      
                      {manhwa.rating > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={manhwa.rating} readOnly size="small" precision={0.5} />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({manhwa.rating})
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon color="action" sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(manhwa.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      {manhwa.categories?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {manhwa.categories.map((category, index) => (
                            <Chip key={index} label={category} size="small" variant="outlined" />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        component={RouterLink}
                        to={`/manhwa/${manhwa.manhwaId}`}
                      >
                        {t('common.view')}
                      </Button>
                      
                      <Box sx={{ ml: 'auto' }}>
                        <IconButton 
                          size="small"
                          onClick={(event) => handleMenuOpen(event, manhwa)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                {t('library.noManhwas')}
              </Typography>
              <Button 
                variant="contained" 
                component={RouterLink}
                to="/browse"
                sx={{ mt: 2 }}
              >
                {t('library.addSome')}
              </Button>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Manhwa Options Menu */}
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
          {t('manhwa.readNow')}
        </MenuItem>
        
        <MenuItem 
          component={RouterLink}
          to={selectedManhwa ? `/manhwa/${selectedManhwa.manhwaId}` : '#'}
          onClick={handleCloseMenu}
        >
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
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.remove')}
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default MyLibrary;