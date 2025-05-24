// src/pages/upload/ManageChapters.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Chip,
  Tooltip
} from '@mui/material';
import {
  AddCircle as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Book as BookIcon,
  AccessTime as TimeIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL;

const ManageChapters = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { manhwaId } = useParams();
  const queryClient = useQueryClient();
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, chapterId: null });
  const [editDialog, setEditDialog] = useState({ open: false, chapter: null });
  const [editTitle, setEditTitle] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Запит на отримання деталей манхви та глав
  const { data, isLoading, error } = useQuery(
    ['userManhwa', manhwaId],
    async () => {
      const response = await axios.get(`${API_URL}/user-manhwa/${manhwaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
    {
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || t('common.error'),
          severity: 'error'
        });
        navigate('/upload/dashboard');
      }
    }
  );
  
  // Мутація для видалення глави
  const deleteChapterMutation = useMutation(
    (chapterId) => {
      return axios.delete(`${API_URL}/user-manhwa/chapter/${chapterId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userManhwa', manhwaId]);
        setSnackbar({
          open: true,
          message: t('upload.chapterDeleted'),
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || t('common.error'),
          severity: 'error'
        });
      }
    }
  );
  
  // Мутація для оновлення глави
  const updateChapterMutation = useMutation(
    ({ chapterId, title }) => {
      return axios.put(`${API_URL}/user-manhwa/chapter/${chapterId}`, 
        { title },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userManhwa', manhwaId]);
        setSnackbar({
          open: true,
          message: t('upload.chapterUpdated'),
          severity: 'success'
        });
        setEditDialog({ open: false, chapter: null });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || t('common.error'),
          severity: 'error'
        });
      }
    }
  );
  
  // Мутація для зміни порядку глав
  const reorderChapterMutation = useMutation(
    ({ chapterId, direction }) => {
      return axios.put(`${API_URL}/user-manhwa/chapter/${chapterId}/reorder`, 
        { direction },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userManhwa', manhwaId]);
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || t('common.error'),
          severity: 'error'
        });
      }
    }
  );
  
  // Обробники подій
  const handleMenuOpen = (event, chapter) => {
    setMenuAnchor(event.currentTarget);
    setSelectedChapter(chapter);
  };
  
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedChapter(null);
  };
  
  const handleEdit = () => {
    handleMenuClose();
    setEditTitle(selectedChapter.title);
    setEditDialog({
      open: true,
      chapter: selectedChapter
    });
  };
  
  const handleMoveChapter = (direction) => {
    handleMenuClose();
    reorderChapterMutation.mutate({
      chapterId: selectedChapter._id,
      direction
    });
  };
  
  const handleDeleteConfirm = () => {
    handleMenuClose();
    setConfirmDialog({
      open: true,
      chapterId: selectedChapter._id
    });
  };
  
  const handleDelete = () => {
    deleteChapterMutation.mutate(confirmDialog.chapterId);
    setConfirmDialog({ open: false, chapterId: null });
  };
  
  const handleCloseDialog = () => {
    setConfirmDialog({ open: false, chapterId: null });
  };
  
  const handleEditSubmit = () => {
    updateChapterMutation.mutate({
      chapterId: editDialog.chapter._id,
      title: editTitle
    });
  };
  
  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, chapter: null });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Сортування глав за номером
  const sortedChapters = data?.chapters?.sort((a, b) => 
    parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber)
  ) || [];
  
  // Функція для форматування дати
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'PP');
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/upload/dashboard')}
                sx={{ mr: 2 }}
              >
                {t('common.back')}
              </Button>
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                className="gradient-text"
                sx={{ fontWeight: 700 }}
              >
                {t('upload.manageChapters')}
              </Typography>
            </Box>
            
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
              {data?.manhwa?.title}
            </Typography>
            
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              elevation={2}
              sx={{ mb: 4 }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">
                  {t('manhwa.chapters')} ({sortedChapters.length})
                </Typography>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to={`/upload/chapter/${manhwaId}`}
                >
                  {t('upload.addChapter')}
                </Button>
              </Box>
              
              {sortedChapters.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <BookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('upload.noChaptersYet')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t('upload.startByAddingChapter')}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to={`/upload/chapter/${manhwaId}`}
                  >
                    {t('upload.addFirstChapter')}
                  </Button>
                </Box>
              ) : (
                <List>
                  <AnimatePresence>
                    {sortedChapters.map((chapter, index) => (
                      <motion.div
                        key={chapter._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {index > 0 && <Divider component="li" />}
                        <ListItem>
                          <ListItemIcon>
                            <BookIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                  {t('manhwa.chapterNumber', { number: chapter.chapterNumber })}
                                </Typography>
                                {chapter.title && (
                                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                                    - {chapter.title}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <TimeIcon sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(chapter.createdAt)}
                                </Typography>
                                
                                {chapter.viewCount > 0 && (
                                  <Chip
                                    icon={<VisibilityIcon sx={{ fontSize: '0.75rem !important' }} />}
                                    label={chapter.viewCount}
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 2, height: 24 }}
                                  />
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title={t('common.view')}>
                              <IconButton
                                edge="end"
                                component={RouterLink}
                                to={`/read/${manhwaId}/chapter/${chapter._id}`}
                                sx={{ mr: 1 }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <IconButton
                              edge="end"
                              onClick={(e) => handleMenuOpen(e, chapter)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
              )}
            </Paper>
          </>
        )}
        
        {/* Контекстне меню для глави */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            {t('common.edit')}
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleMoveChapter('up')}
            disabled={selectedChapter && sortedChapters.indexOf(selectedChapter) === 0}
          >
            <MoveUpIcon fontSize="small" sx={{ mr: 1 }} />
            {t('upload.moveUp')}
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleMoveChapter('down')}
            disabled={selectedChapter && sortedChapters.indexOf(selectedChapter) === sortedChapters.length - 1}
          >
            <MoveDownIcon fontSize="small" sx={{ mr: 1 }} />
            {t('upload.moveDown')}
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleDeleteConfirm} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            {t('common.delete')}
          </MenuItem>
        </Menu>
        
        {/* Діалог підтвердження видалення */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCloseDialog}
        >
          <DialogTitle>{t('upload.confirmDeleteChapter')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('upload.deleteChapterWarning')}
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 500 }}>
              {t('common.thisCantBeUndone')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleDelete} 
              color="error"
              variant="contained"
              disabled={deleteChapterMutation.isLoading}
            >
              {deleteChapterMutation.isLoading ? t('common.loading') : t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Діалог редагування глави */}
        <Dialog
          open={editDialog.open}
          onClose={handleCloseEditDialog}
        >
          <DialogTitle>{t('upload.editChapter')}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" gutterBottom>
              {t('manhwa.chapterNumber', { number: editDialog.chapter?.chapterNumber || '' })}
            </Typography>
            
            <TextField
              autoFocus
              margin="dense"
              label={t('upload.chapterTitle')}
              fullWidth
              variant="outlined"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              color="primary"
              variant="contained"
              disabled={updateChapterMutation.isLoading}
            >
              {updateChapterMutation.isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default ManageChapters;