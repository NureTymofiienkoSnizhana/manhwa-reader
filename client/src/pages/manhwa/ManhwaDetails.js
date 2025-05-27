import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardMedia,
  Chip,
  Divider,
  Rating,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Skeleton,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  BookmarkAdd as BookmarkAddIcon,
  Create as CreateIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getManhwaDetails, getManhwaChapters, updateReadingProgress } from '../../api/manhwaService';
import { addManhwaToCategory } from '../../api/categoryService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const ManhwaDetails = () => {
  const { t } = useTranslation();
  const { manhwaId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  
  // Визначаємо, чи це користувацька манга чи зовнішня
  const isUserManga = manhwaId.length === 24 && /^[0-9a-fA-F]{24}$/.test(manhwaId);
  
  // Fetch manhwa details - з урахуванням типу манги (користувацька чи зовнішня)
  const { data: detailsData, isLoading: detailsLoading, error: detailsError } = useQuery(
    ['manhwaDetails', manhwaId],
    async () => {
      try {
        if (isUserManga) {
          console.log("Fetching user manhwa details");
          const response = await axios.get(`${API_URL}/user-manhwa/${manhwaId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          return response.data;
        } else {
          console.log("Fetching external manhwa details");
          const response = await axios.get(`${API_URL}/manhwa/${manhwaId}`);
          return response.data;
        }
      } catch (error) {
        console.error("Error fetching manhwa details:", error);
        throw error;
      }
    },
    { 
      staleTime: 300000, // 5 хвилин
      retry: 1,
      onError: (error) => {
        console.error("Error in useQuery:", error);
        showError(error.response?.data?.message || t('common.error'));
      }
    }
  );
  
  // Отримання глав окремим запитом, якщо вони не включені в детальну інформацію
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery(
    ['manhwaChapters', manhwaId],
    async () => {
      try {
        if (isUserManga) {
          // Якщо chapters вже включені в detailsData, пропускаємо цей запит
          if (detailsData?.chapters) {
            return { chapters: detailsData.chapters };
          }
          
          const response = await axios.get(`${API_URL}/user-manhwa/${manhwaId}/chapters`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          return response.data;
        } else {
          const response = await getManhwaChapters(manhwaId);
          return response;
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        throw error;
      }
    },
    { 
      enabled: !!detailsData && !detailsData.chapters, // Запит активний тільки якщо у detailsData немає chapters
      staleTime: 300000 // 5 хвилин
    }
  );
  
  // Отримуємо інформацію про манхву та глави
  const manga = isUserManga ? detailsData?.manhwa : detailsData?.manga;
  const userProgress = detailsData?.userProgress;
  
  // Отримуємо глави або з detailsData, або з chaptersData
  const chapters = detailsData?.chapters || chaptersData?.chapters || [];
  
  // Мутація для оновлення прогресу читання (тільки для зовнішніх манхв)
  const updateProgressMutation = useMutation(
    (progressData) => updateReadingProgress(manhwaId, progressData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['manhwaDetails', manhwaId]);
        showSuccess(data.message || t('common.success'));
        setIsAddingToLibrary(false);
      },
      onError: (error) => {
        showError(error.message || t('common.error'));
        setIsAddingToLibrary(false);
      }
    }
  );
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Open menu for status
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Close menu
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStatus(null);
  };
  
  // Update status
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setIsAddingToLibrary(true);
    updateProgressMutation.mutate({ status });
    handleMenuClose();
  };
  
  // Open review dialog
  const handleOpenReviewDialog = () => {
    if (userProgress) {
      setReviewText(userProgress.review || '');
      setRating(userProgress.rating || 0);
    }
    setOpenReviewDialog(true);
  };
  
  // Close review dialog
  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
  };
  
  // Submit review
  const handleSubmitReview = () => {
    updateProgressMutation.mutate({ 
      review: reviewText, 
      rating 
    });
    setOpenReviewDialog(false);
  };
  
  // Start reading
  const handleStartReading = () => {
    if (chapters && chapters.length > 0) {
      // If user has progress, navigate to last read chapter
      if (userProgress && userProgress.lastChapterRead > 0) {
        const lastReadChapter = chapters.find(
          ch => ch.chapter === userProgress.lastChapterRead.toString()
        );
        
        if (lastReadChapter) {
          navigate(`/read/${lastReadChapter.id}`);
          return;
        }
      }
      
      // Otherwise start from first chapter
      navigate(`/read/${chapters[0].id}`);
    }
  };
  
  // Add to library - виправлена логіка
  const handleAddToLibrary = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Показуємо стан завантаження
    setIsAddingToLibrary(true);
    
    // Додаємо з статусом 'reading' за замовчуванням
    updateProgressMutation.mutate({ 
      status: 'reading',
      lastChapterRead: 0,
      isCompleted: false
    });
  };
  
  // Mark as completed
  const handleMarkAsCompleted = () => {
    setIsAddingToLibrary(true);
    updateProgressMutation.mutate({ 
      isCompleted: true,
      status: 'completed'
    });
  };
  
  // Format publication date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Loading states
  if (detailsLoading) {
    return (
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 4, md: 4 }}>
            <Skeleton variant="rectangular" height={500} />
          </Grid>
          <Grid item xs={8} md={8}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={100} height={40} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    );
  }
  
  // Error state
  if (detailsError || !manga) {
    console.error("Error details:", detailsError);
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {t('common.error')}
          </Typography>
          <Typography>
            {detailsError?.response?.data?.message || t('common.tryAgain')}
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink}
            to="/browse"
            sx={{ mt: 2 }}
          >
            {t('nav.browse')}
          </Button>
        </Box>
      </Container>
    );
  }
  
  // Визначаємо, чи користувач є автором манги (для користувацьких манг)
  const isAuthor = isUserManga && manga.creator && user && manga.creator === user.id;
  
  return (
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        {/* Cover image - завжди зліва */}
        <Grid size={{ xs: 4, md: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card elevation={2}>
              <CardMedia
                component="img"
                image={manga.coverImage || '/placeholder-cover.jpg'}
                alt={manga.title}
                sx={{ height: 500, objectFit: 'cover' }}
              />
            </Card>
            
            {/* Action buttons під обкладинкою */}
            {isAuthenticated && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {chapters && chapters.length > 0 ? (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleStartReading}
                    startIcon={<VisibilityIcon />}
                  >
                    {t('manhwa.readNow')}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled
                  >
                    {t('manhwa.noChapters')}
                  </Button>
                )}
                
                {!isUserManga && !userProgress ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleAddToLibrary}
                    startIcon={<BookmarkAddIcon />}
                    disabled={isAddingToLibrary}
                  >
                    {isAddingToLibrary ? t('common.loading') : t('manhwa.addToLibrary')}
                  </Button>
                ) : !isUserManga && (
                  <>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleMenuOpen}
                      endIcon={<MoreVertIcon />}
                    >
                      {t(`library.${userProgress.status || 'reading'}`)}
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem 
                        onClick={() => handleStatusChange('reading')}
                        selected={userProgress.status === 'reading'}
                      >
                        {t('library.reading')}
                      </MenuItem>
                      <MenuItem 
                        onClick={() => handleStatusChange('completed')}
                        selected={userProgress.status === 'completed'}
                      >
                        {t('library.completed')}
                      </MenuItem>
                      <MenuItem 
                        onClick={() => handleStatusChange('plan_to_read')}
                        selected={userProgress.status === 'plan_to_read'}
                      >
                        {t('library.planToRead')}
                      </MenuItem>
                      <MenuItem 
                        onClick={() => handleStatusChange('dropped')}
                        selected={userProgress.status === 'dropped'}
                      >
                        {t('library.dropped')}
                      </MenuItem>
                    </Menu>
                  </>
                )}
                
                {isUserManga && isAuthor && (
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to={`/upload/edit/${manhwaId}`}
                    startIcon={<CreateIcon />}
                  >
                    {t('common.edit')}
                  </Button>
                )}
                
                {!isUserManga && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant="outlined"
                      sx={{ flex: 1 }}
                      onClick={handleOpenReviewDialog}
                      startIcon={<CreateIcon />}
                    >
                      {userProgress?.review ? t('manhwa.editReview') : t('manhwa.addReview')}
                    </Button>
                    
                    <IconButton>
                      <ShareIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            )}
          </motion.div>
        </Grid>
        
        {/* Manhwa details - завжди справа */}
        <Grid size={{ xs: 8, md: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              {manga.title}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {manga.tags?.map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  size="small" 
                  component={RouterLink}
                  to={`/browse?genre=${tag}`}
                  clickable
                />
              ))}
              {manga.genres?.map((genre, index) => (
                <Chip 
                  key={index} 
                  label={genre} 
                  size="small" 
                  component={RouterLink}
                  to={`/browse?genre=${genre}`}
                  clickable
                />
              ))}
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('manhwa.status')}
                </Typography>
                <Typography variant="body1">
                  {t(`manhwa.${manga.status}`) || 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('manhwa.author')}
                </Typography>
                <Typography variant="body1">
                  {manga.author || 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('manhwa.releaseDate')}
                </Typography>
                <Typography variant="body1">
                  {manga.publishedAt ? formatDate(manga.publishedAt) : 
                   manga.createdAt ? formatDate(manga.createdAt) : 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('manhwa.rating')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={manga.rating || 0} readOnly precision={0.5} size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({manga.rating || 0})
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 3 }} />
            
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label={t('common.about')} />
              <Tab label={t('manhwa.chapters')} />
              {userProgress?.review && <Tab label={t('manhwa.yourReview')} />}
            </Tabs>
            
            {/* About Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="body1" paragraph>
                  {manga.description || 'No description available.'}
                </Typography>
              </Box>
            )}
            
            {/* Chapters Tab */}
            {activeTab === 1 && (
              <Box>
                {chaptersLoading ? (
                  Array.from(new Array(10)).map((_, index) => (
                    <Skeleton key={index} height={60} sx={{ my: 1 }} />
                  ))
                ) : chapters && chapters.length > 0 ? (
                  <Paper variant="outlined">
                    <List sx={{ p: 0 }}>
                      {chapters.map((chapter, index) => (
                        <React.Fragment key={chapter.id || chapter._id}>
                          {index > 0 && <Divider />}
                          <ListItem
                            button
                            component={RouterLink}
                            to={isUserManga 
                              ? `/read/${manhwaId}/chapter/${chapter._id}` 
                              : `/read/${chapter.id}`
                            }
                            sx={{
                              bgcolor: userProgress?.lastChapterRead >= chapter.chapter 
                                ? 'action.selected' 
                                : 'inherit'
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box>
                                  {t('manhwa.chapterNumber', { number: chapter.chapter || chapter.chapterNumber })}
                                  {chapter.title && `: ${chapter.title}`}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <AccessTimeIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                                  <Box component="span">
                                    {formatDate(chapter.publishedAt || chapter.createdAt)}
                                  </Box>
                                </Box>
                              }
                            />
                            {userProgress?.lastChapterRead >= (chapter.chapter || chapter.chapterNumber) && (
                              <ListItemIcon sx={{ minWidth: 'auto' }}>
                                <VisibilityIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                            )}
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Typography>
                    {t('manhwa.noChapters')}
                  </Typography>
                )}
                
                {/* Додаткова кнопка для авторів користувацьких манг */}
                {isUserManga && isAuthor && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      component={RouterLink}
                      to={`/upload/chapter/${manhwaId}`}
                      startIcon={<CreateIcon />}
                    >
                      {t('upload.addChapter')}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
            
            {/* User Review Tab */}
            {activeTab === 2 && userProgress?.review && (
              <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={userProgress.rating || 0} readOnly />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({userProgress.rating}/5)
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {userProgress.review}
                </Typography>
              </Box>
            )}
          </motion.div>
        </Grid>
      </Grid>
      
      {/* Review Dialog */}
      <Dialog open={openReviewDialog} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('manhwa.addReview')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography component="legend">{t('manhwa.rating')}</Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('manhwa.yourReview')}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmitReview} variant="contained">
            {t('common.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManhwaDetails;