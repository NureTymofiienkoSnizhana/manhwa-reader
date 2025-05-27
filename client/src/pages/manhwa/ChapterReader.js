import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Container,
  Skeleton,
  Paper,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getChapterContent, getManhwaChapters, updateReadingProgress } from '../../api/manhwaService';
import { getManhwaDetails } from '../../api/manhwaService';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const ChapterReader = () => {
  const { t } = useTranslation();
  const { chapterId, manhwaId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [readingMode, setReadingMode] = useState('vertical'); // vertical, horizontal, paged
  const [showControls, setShowControls] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [chapterData, setChapterData] = useState(null);
  const [chapterManhwaId, setChapterManhwaId] = useState(null);
  const [chapterNumber, setChapterNumber] = useState(null);
  
  // Визначаємо, чи це користувацька манга чи зовнішня
  const isUserManhwa = manhwaId && chapterId;
  
  // Отримання даних глави
  useEffect(() => {
    const fetchChapterContent = async () => {
      try {
        if (isUserManhwa) {
          // Запит для користувацької манги
          const response = await axios.get(`${API_URL}/user-manhwa/chapter/${chapterId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setChapterData(response.data);
          setChapterManhwaId(manhwaId);
          setChapterNumber(response.data.chapter?.chapterNumber || '1');
        } else {
          // Запит для зовнішніх манг
          const response = await getChapterContent(chapterId);
          setChapterData(response);
          
          // Отримуємо інформацію про главу для отримання manhwaId
          try {
            const chapterInfoResponse = await fetch(`${process.env.REACT_APP_MANGADEX_API_URL}/chapter/${chapterId}`);
            const data = await chapterInfoResponse.json();
            
            if (data.data) {
              const mangaId = data.data.relationships.find(rel => rel.type === 'manga')?.id;
              if (mangaId) {
                setChapterManhwaId(mangaId);
                setChapterNumber(data.data.attributes.chapter);
              }
            }
          } catch (error) {
            console.error('Error fetching chapter info:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching chapter content:', error);
      }
    };

    if (chapterId) {
      fetchChapterContent();
    }
  }, [chapterId, manhwaId, isUserManhwa]);
  
  // Fetch chapters to get the current chapter info
  const { data: chaptersData } = useQuery(
    ['manhwaChapters', chapterManhwaId],
    () => isUserManhwa 
      ? axios.get(`${API_URL}/user-manhwa/${chapterManhwaId}/chapters`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.data)
      : getManhwaChapters(chapterManhwaId),
    { 
      enabled: !!chapterManhwaId,
      staleTime: 300000 // 5 minutes
    }
  );
  
  // Fetch manhwa details to show title
  const { data: detailsData } = useQuery(
    ['manhwaDetails', chapterManhwaId],
    () => isUserManhwa
      ? axios.get(`${API_URL}/user-manhwa/${chapterManhwaId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.data)
      : getManhwaDetails(chapterManhwaId),
    { 
      enabled: !!chapterManhwaId,
      staleTime: 300000 // 5 minutes
    }
  );
  
  // Mutation for updating reading progress
  const updateProgressMutation = useMutation(
    (progressData) => updateReadingProgress(chapterManhwaId, progressData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['manhwaDetails', chapterManhwaId]);
        setShowSnackbar(true);
      }
    }
  );
  
  // Update reading progress when chapter is loaded
  useEffect(() => {
    if (isAuthenticated && chapterManhwaId && chapterNumber) {
      updateProgressMutation.mutate({ 
        lastChapterRead: parseInt(chapterNumber),
        isCompleted: false // Don't mark as completed yet
      });
    }
  }, [isAuthenticated, chapterManhwaId, chapterNumber, updateProgressMutation]);
  
  // Get pages
  const pages = isUserManhwa
    ? chapterData?.chapter?.pages || []
    : chapterData?.pages || [];
  
  // Get manga info
  const manga = isUserManhwa 
    ? detailsData?.manhwa
    : detailsData?.manga;
    
  const chapters = isUserManhwa
    ? chaptersData?.chapters || []
    : chaptersData?.chapters || [];
  
  // Find current chapter index
  const currentChapterIndex = chapters.findIndex(ch => 
    isUserManhwa ? ch._id === chapterId : ch.id === chapterId
  );
  
  // Get next and previous chapters
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;
  
  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    }
  };
  
  // Open settings menu
  const handleSettingsOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  // Close settings menu
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  // Change reading mode
  const handleReadingModeChange = (event) => {
    setReadingMode(event.target.value);
    handleSettingsClose();
  };
  
  // Navigate to previous page
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Navigate to next page
  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (nextChapter) {
      // Go to next chapter
      navigate(isUserManhwa
        ? `/read/${chapterManhwaId}/chapter/${nextChapter._id}`
        : `/read/${nextChapter.id}`
      );
    }
  };
  
  // Navigate to previous chapter
  const goToPrevChapter = () => {
    if (prevChapter) {
      navigate(isUserManhwa
        ? `/read/${chapterManhwaId}/chapter/${prevChapter._id}`
        : `/read/${prevChapter.id}`
      );
    }
  };
  
  // Navigate to next chapter
  const goToNextChapter = () => {
    if (nextChapter) {
      navigate(isUserManhwa
        ? `/read/${chapterManhwaId}/chapter/${nextChapter._id}`
        : `/read/${nextChapter.id}`
      );
    } else if (chapterManhwaId) {
      // Mark as completed if this is the last chapter
      updateProgressMutation.mutate({ 
        isCompleted: true,
        status: 'completed'
      });
      
      // Navigate back to manhwa page
      navigate(`/manhwa/${chapterManhwaId}`);
    }
  };
  
  // Handle key press for navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          if (readingMode === 'horizontal' || readingMode === 'paged') {
            goToPrevPage();
          }
          break;
        case 'ArrowRight':
          if (readingMode === 'horizontal' || readingMode === 'paged') {
            goToNextPage();
          }
          break;
        case 'Escape':
          if (fullscreen) {
            document.exitFullscreen();
            setFullscreen(false);
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [readingMode, currentPage, pages.length, prevChapter, nextChapter, fullscreen]);
  
  // Toggle controls on mobile
  const handleContentClick = () => {
    if (isMobile) {
      setShowControls(!showControls);
    }
  };
  
  return (
    <Box 
      sx={{ 
        bgcolor: 'background.default',
        color: 'text.primary',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Reader controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <AppBar 
              position="sticky" 
              color="default" 
              elevation={0}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Toolbar>
                <IconButton 
                  edge="start" 
                  color="inherit" 
                  aria-label="back"
                  onClick={() => navigate(chapterManhwaId ? `/manhwa/${chapterManhwaId}` : '/browse')}
                >
                  <ArrowBackIcon />
                </IconButton>
                
                <IconButton
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleDrawer}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                  {manga?.title || t('manhwa.reading')}
                  {chapterNumber && ` - ${t('manhwa.chapterNumber', { number: chapterNumber })}`}
                </Typography>
                
                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <Button
                    color="inherit"
                    startIcon={<PrevIcon />}
                    onClick={goToPrevChapter}
                    disabled={!prevChapter}
                  >
                    {t('manhwa.previousChapter')}
                  </Button>
                  
                  <Button
                    color="inherit"
                    endIcon={<NextIcon />}
                    onClick={goToNextChapter}
                    disabled={!nextChapter}
                    sx={{ mx: 1 }}
                  >
                    {t('manhwa.nextChapter')}
                  </Button>
                </Box>
                
                <IconButton
                  color="inherit"
                  aria-label="settings"
                  onClick={handleSettingsOpen}
                >
                  <SettingsIcon />
                </IconButton>
                
                <Menu
                  anchorEl={settingsAnchorEl}
                  open={Boolean(settingsAnchorEl)}
                  onClose={handleSettingsClose}
                >
                  <MenuItem>
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="reading-mode-label">
                        {t('common.readingMode')}
                      </InputLabel>
                      <Select
                        labelId="reading-mode-label"
                        value={readingMode}
                        onChange={handleReadingModeChange}
                        label={t('common.readingMode')}
                      >
                        <MenuItem value="vertical">{t('common.vertical')}</MenuItem>
                        <MenuItem value="horizontal">{t('common.horizontal')}</MenuItem>
                        <MenuItem value="paged">{t('common.paged')}</MenuItem>
                      </Select>
                    </FormControl>
                  </MenuItem>
                  <MenuItem onClick={toggleFullscreen}>
                    {fullscreen ? (
                      <>
                        <FullscreenExitIcon sx={{ mr: 1 }} />
                        {t('common.exitFullscreen')}
                      </>
                    ) : (
                      <>
                        <FullscreenIcon sx={{ mr: 1 }} />
                        {t('common.enterFullscreen')}
                      </>
                    )}
                  </MenuItem>
                </Menu>
                
                <IconButton
                  color="inherit"
                  aria-label="home"
                  onClick={() => navigate('/')}
                  sx={{ ml: 1 }}
                >
                  <HomeIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chapter drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 280 }}
          role="presentation"
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" noWrap>
              {manga?.title || t('manhwa.chapters')}
            </Typography>
          </Box>
          <Divider />
          <List sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
            {chapters.map((chapter) => (
              <ListItem
                button
                key={isUserManhwa ? chapter._id : chapter.id}
                onClick={() => {
                  navigate(isUserManhwa
                    ? `/read/${chapterManhwaId}/chapter/${chapter._id}`
                    : `/read/${chapter.id}`
                  );
                  toggleDrawer();
                }}
                selected={isUserManhwa
                  ? chapter._id === chapterId
                  : chapter.id === chapterId
                }
              >
                <ListItemText 
                  primary={`${t('manhwa.chapterNumber', { number: chapter.chapter || chapter.chapterNumber })}`}
                  secondary={chapter.title}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      {/* Chapter content */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5'
        }}
        onClick={handleContentClick}
      >
        {!chapterData ? (
          <Container maxWidth="md" sx={{ py: 4 }}>
            {Array.from(new Array(5)).map((_, index) => (
              <Skeleton 
                key={index}
                variant="rectangular"
                width="100%"
                height={600}
                sx={{ mb: 2 }}
              />
            ))}
          </Container>
        ) : pages.length > 0 ? (
          <>
            {readingMode === 'vertical' && (
              <Container 
                maxWidth="md" 
                sx={{ 
                  py: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                {pages.map((page, index) => (
                  <Paper 
                    key={index}
                    elevation={2}
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Box
                      component="img"
                      src={page}
                      alt={`Page ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                  </Paper>
                ))}
                
                {/* Navigation buttons at the bottom */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  width: '100%',
                  mt: 4
                }}>
                  <Button
                    variant="contained"
                    startIcon={<PrevIcon />}
                    onClick={goToPrevChapter}
                    disabled={!prevChapter}
                  >
                    {t('manhwa.previousChapter')}
                  </Button>
                  
                  <Button
                    variant="contained"
                    endIcon={<NextIcon />}
                    onClick={goToNextChapter}
                    disabled={!nextChapter}
                  >
                    {t('manhwa.nextChapter')}
                  </Button>
                </Box>
              </Container>
            )}
            
            {(readingMode === 'horizontal' || readingMode === 'paged') && (
              <Box sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: '20%',
                  zIndex: 1,
                  cursor: 'pointer'
                }} 
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevPage();
                }}
                />
                
                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '20%',
                  zIndex: 1,
                  cursor: 'pointer'
                }} 
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPage();
                }}
                />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: readingMode === 'horizontal' ? 100 : 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: readingMode === 'horizontal' ? -100 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      width: '100%'
                    }}
                  >
                    <Paper elevation={4}>
                      <Box
                        component="img"
                        src={pages[currentPage]}
                        alt={`Page ${currentPage + 1}`}
                        sx={{
                          maxHeight: 'calc(100vh - 100px)',
                          maxWidth: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </Paper>
                  </motion.div>
                </AnimatePresence>
                
                {/* Page indicator */}
                <Box sx={{ 
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 2
                }}>
                  {currentPage + 1} / {pages.length}
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Container>
            <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {t('manhwa.noChapters')}
              </Typography>
              <Button 
                variant="contained"
                onClick={() => navigate(chapterManhwaId ? `/manhwa/${chapterManhwaId}` : '/browse')}
                sx={{ mt: 2 }}
              >
                {t('common.back')}
              </Button>
            </Paper>
          </Container>
        )}
      </Box>
      
      {/* Progress snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity="success">
          {t('common.progressSaved')}
        </Alert>
      </Snackbar>
      
      {/* Navigation buttons for mobile */}
      <AnimatePresence>
        {showControls && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <Paper 
              elevation={4}
              sx={{ 
                position: 'fixed',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                borderRadius: 4,
                overflow: 'hidden'
              }}
            >
              <Button
                color="primary"
                onClick={goToPrevChapter}
                disabled={!prevChapter}
                sx={{ px: 3 }}
              >
                <PrevIcon />
              </Button>
              
              {readingMode !== 'vertical' && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    color="primary"
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                    sx={{ px: 3 }}
                  >
                    <PrevIcon />
                  </Button>
                  
                  <Divider orientation="vertical" flexItem />
                  <Button
                    color="primary"
                    onClick={goToNextPage}
                    disabled={currentPage === pages.length - 1}
                    sx={{ px: 3 }}
                  >
                    <NextIcon />
                  </Button>
                </>
              )}
              
              <Divider orientation="vertical" flexItem />
              <Button
                color="primary"
                onClick={goToNextChapter}
                disabled={!nextChapter}
                sx={{ px: 3 }}
              >
                <NextIcon />
              </Button>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ChapterReader;