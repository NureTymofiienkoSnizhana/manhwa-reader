// src/pages/upload/UploadChapter.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Image as ImageIcon,
  AddCircle as AddCircleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = process.env.REACT_APP_API_URL;

const UploadChapter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { manhwaId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    chapterNumber: '',
  });
  
  const [pages, setPages] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, content: '' });
  
  // Отримання деталей манхви
  const { data: manhwaData, isLoading: manhwaLoading } = useQuery(
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
        navigate('/upload');
      }
    }
  );
  
  // Отримання попереднього номера глави
  useEffect(() => {
    if (manhwaData && manhwaData.manhwa) {
      const lastChapterNumber = manhwaData.manhwa.lastChapterNumber || 0;
      setFormData(prev => ({
        ...prev,
        chapterNumber: (lastChapterNumber + 1).toString()
      }));
    }
  }, [manhwaData]);
  
  // Мутація для завантаження глави
  const uploadMutation = useMutation(
    (data) => {
      const formPayload = new FormData();
      
      // Додавання полів форми
      formPayload.append('title', data.title);
      formPayload.append('chapterNumber', data.chapterNumber);
      
      // Додавання сторінок
      data.pages.forEach(page => {
        formPayload.append('pages', page);
      });
      
      return axios.post(`${API_URL}/user-manhwa/${manhwaId}/chapter`, formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    {
      onSuccess: (data) => {
        setSnackbar({
          open: true,
          message: data.data.message || t('common.success'),
          severity: 'success'
        });
        
        // Відображення діалогу з питанням про наступні дії
        setConfirmDialog({
          open: true,
          content: 'uploadMore'
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
  
  // Функції для обробки змін у формі
  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    
    // Скидання помилки при редагуванні
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  const handlePagesChange = (event) => {
    const files = Array.from(event.target.files);
    setPages([...pages, ...files]);
    
    // Скидання помилки
    if (errors.pages) {
      setErrors({
        ...errors,
        pages: ''
      });
    }
  };
  
  const handleRemovePage = (index) => {
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
  };
  
  const handleMovePage = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === pages.length - 1)
    ) {
      return;
    }
    
    const newPages = [...pages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Зміна позицій
    [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
    
    setPages(newPages);
  };
  
  // Функція для обробки перетягування (drag and drop)
  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPages(items);
  };
  
  // Валідація форми
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.chapterNumber.trim()) {
      newErrors.chapterNumber = t('common.fieldRequired');
    } else if (isNaN(formData.chapterNumber)) {
      newErrors.chapterNumber = t('upload.validNumber');
    }
    
    if (pages.length === 0) {
      newErrors.pages = t('upload.pagesRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Відправка форми
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      uploadMutation.mutate({
        ...formData,
        pages
      });
    }
  };
  
  // Закриття повідомлення Snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Обробка діалогу підтвердження
  const handleConfirmDialogClose = (action) => {
    setConfirmDialog({ open: false, content: '' });
    
    if (action === 'another') {
      // Очистка форми для завантаження нової глави
      setFormData({
        title: '',
        chapterNumber: (parseFloat(formData.chapterNumber) + 1).toString()
      });
      setPages([]);
      setErrors({});
    } else if (action === 'view') {
      // Перехід до перегляду манхви
      navigate(`/manhwa/${manhwaId}`);
    } else if (action === 'dashboard') {
      // Перехід до дашборду
      navigate('/upload/dashboard');
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {manhwaLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              className="gradient-text"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              {t('upload.addChapter')}
            </Typography>
            
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
              {manhwaData?.manhwa?.title}
            </Typography>
            
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              elevation={2}
              sx={{ p: 3, mb: 4 }}
            >
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Інформація про главу */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('upload.chapterNumber')}
                      variant="outlined"
                      name="chapterNumber"
                      value={formData.chapterNumber}
                      onChange={handleChange('chapterNumber')}
                      error={!!errors.chapterNumber}
                      helperText={errors.chapterNumber}
                      required
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      fullWidth
                      label={t('upload.chapterTitle')}
                      variant="outlined"
                      name="title"
                      value={formData.title}
                      onChange={handleChange('title')}
                      placeholder={t('upload.chapterTitlePlaceholder')}
                      sx={{ mb: 3 }}
                    />
                    
                    <input
                      accept="image/*"
                      id="pages-upload"
                      type="file"
                      hidden
                      multiple
                      onChange={handlePagesChange}
                    />
                    
                    <label htmlFor="pages-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        startIcon={<UploadIcon />}
                      >
                        {t('upload.selectPages')}
                      </Button>
                    </label>
                    
                    {errors.pages && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        {errors.pages}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('upload.pagesHelp')}
                    </Typography>
                  </Grid>
                  
                  {/* Перегляд та сортування сторінок */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('upload.pagesPreview')} ({pages.length})
                    </Typography>
                    
                    {pages.length > 0 ? (
                      <Box sx={{ height: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <DragDropContext onDragEnd={onDragEnd}>
                          <Droppable droppableId="pages">
                            {(provided) => (
                              <List
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                dense
                              >
                                {pages.map((page, index) => (
                                  <Draggable key={index} draggableId={`page-${index}`} index={index}>
                                    {(provided) => (
                                      <ListItem
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        sx={{ 
                                          bgcolor: 'background.paper', 
                                          mb: 1, 
                                          borderRadius: 1,
                                          '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                      >
                                        <ListItemIcon>
                                          <ImageIcon />
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={`${t('upload.page')} ${index + 1}`} 
                                          secondary={page.name}
                                        />
                                        <ListItemSecondaryAction>
                                          <IconButton 
                                            edge="end" 
                                            onClick={() => handleMovePage(index, 'up')}
                                            disabled={index === 0}
                                          >
                                            <ArrowUpIcon />
                                          </IconButton>
                                          <IconButton 
                                            edge="end" 
                                            onClick={() => handleMovePage(index, 'down')}
                                            disabled={index === pages.length - 1}
                                          >
                                            <ArrowDownIcon />
                                          </IconButton>
                                          <IconButton 
                                            edge="end" 
                                            onClick={() => handleRemovePage(index)}
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </ListItemSecondaryAction>
                                      </ListItem>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </List>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          height: 400,
                          border: '1px dashed',
                          borderColor: 'grey.400',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          borderRadius: 1
                        }}
                      >
                        <AddCircleIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          {t('upload.noPages')}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    startIcon={<SaveIcon />}
                    size="large"
                    disabled={uploadMutation.isLoading}
                  >
                    {uploadMutation.isLoading ? t('common.loading') : t('upload.publishChapter')}
                  </Button>
                </Box>
              </form>
            </Paper>
            
            {/* Корисні поради */}
            <Paper
              elevation={2}
              sx={{ p: 3 }}
            >
              <Typography variant="h6" gutterBottom>
                {t('upload.pagesTips')}
              </Typography>
              
              <Typography variant="body2" paragraph>
                • {t('upload.pagesTip1')}
              </Typography>
              <Typography variant="body2" paragraph>
                • {t('upload.pagesTip2')}
              </Typography>
              <Typography variant="body2" paragraph>
                • {t('upload.pagesTip3')}
              </Typography>
              <Typography variant="body2">
                • {t('upload.pagesTip4')}
              </Typography>
            </Paper>
          </>
        )}
        
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
        
        {/* Діалог після успішного завантаження */}
        <Dialog
          open={confirmDialog.open && confirmDialog.content === 'uploadMore'}
          onClose={() => handleConfirmDialogClose('')}
        >
          <DialogTitle>{t('upload.chapterUploaded')}</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              {t('upload.whatNext')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleConfirmDialogClose('another')} color="primary">
              {t('upload.addAnotherChapter')}
            </Button>
            <Button onClick={() => handleConfirmDialogClose('view')} color="secondary">
              {t('upload.viewManhwa')}
            </Button>
            <Button onClick={() => handleConfirmDialogClose('dashboard')}>
              {t('upload.backToDashboard')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UploadChapter;