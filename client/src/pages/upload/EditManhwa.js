// src/pages/upload/EditManhwa.js
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  FormHelperText,
  Alert,
  Snackbar,
  Card,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL;

const EditManhwa = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { manhwaId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    genres: [],
    tags: [],
    status: 'ongoing'
  });
  
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [originalCover, setOriginalCover] = useState('');
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '' });
  
  // Доступні жанри та статуси
  const availableGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
    'Horror', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 
    'Supernatural', 'Thriller', 'Mystery', 'School', 
    'Historical', 'Military'
  ];
  
  const statusOptions = [
    { value: 'ongoing', label: t('manhwa.ongoing') },
    { value: 'completed', label: t('manhwa.completed') },
    { value: 'hiatus', label: t('manhwa.hiatus') },
    { value: 'cancelled', label: t('manhwa.cancelled') }
  ];
  
  // Запит на отримання деталей манхви
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
      onSuccess: (data) => {
        if (data.manhwa) {
          setFormData({
            title: data.manhwa.title,
            description: data.manhwa.description,
            author: data.manhwa.author || '',
            genres: data.manhwa.genres || [],
            tags: data.manhwa.tags || [],
            status: data.manhwa.status || 'ongoing'
          });
          
          setOriginalCover(data.manhwa.coverImage);
          setCoverPreview(data.manhwa.coverImage);
        }
      },
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
  
  // Мутація для оновлення манхви
  const updateMutation = useMutation(
    (data) => {
      const formPayload = new FormData();
      
      // Додавання полів форми
      formPayload.append('title', data.title);
      formPayload.append('description', data.description);
      if (data.author) formPayload.append('author', data.author);
      formPayload.append('genres', JSON.stringify(data.genres));
      formPayload.append('tags', JSON.stringify(data.tags));
      formPayload.append('status', data.status);
      
      // Додавання обкладинки, якщо вона змінена
      if (data.coverImage) {
        formPayload.append('cover', data.coverImage);
      }
      
      return axios.put(`${API_URL}/user-manhwa/${manhwaId}`, formPayload, {
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
        
        // Показати діалог з питанням про наступні дії
        setConfirmDialog({
          open: true,
          type: 'update'
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
  
  // Мутація для видалення манхви
  const deleteMutation = useMutation(
    () => {
      return axios.delete(`${API_URL}/user-manhwa/${manhwaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: t('upload.manhwaDeleted'),
          severity: 'success'
        });
        
        // Перенаправлення на дашборд після короткої затримки
        setTimeout(() => {
          navigate('/upload/dashboard');
        }, 1500);
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
  
  const handleGenresChange = (event, newValue) => {
    setFormData({
      ...formData,
      genres: newValue
    });
  };
  
  const handleTagsChange = (event, newValue) => {
    setFormData({
      ...formData,
      tags: newValue
    });
  };
  
  const handleCoverChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverImage(file);
      
      // Створення URL для перегляду
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
      
      // Скидання помилки
      if (errors.cover) {
        setErrors({
          ...errors,
          cover: ''
        });
      }
    }
  };
  
  // Валідація форми
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('common.fieldRequired');
    }
    
    if (!formData.description.trim()) {
      newErrors.description = t('common.fieldRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Відправка форми
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateMutation.mutate({
        ...formData,
        coverImage
      });
    }
  };
  
  // Відкриття діалогу підтвердження видалення
  const handleOpenDeleteDialog = () => {
    setConfirmDialog({
      open: true,
      type: 'delete'
    });
  };
  
  // Закриття діалогу
  const handleCloseDialog = () => {
    setConfirmDialog({
      open: false,
      type: ''
    });
  };
  
  // Видалення манхви
  const handleDelete = () => {
    handleCloseDialog();
    deleteMutation.mutate();
  };
  
  // Закриття повідомлення Snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Обробка діалогу після оновлення
  const handleAfterUpdate = (action) => {
    handleCloseDialog();
    
    if (action === 'view') {
      navigate(`/manhwa/${manhwaId}`);
    } else if (action === 'chapters') {
      navigate(`/upload/chapter/${manhwaId}`);
    } else if (action === 'dashboard') {
      navigate('/upload/dashboard');
    }
  };
  
  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          className="gradient-text"
          sx={{ fontWeight: 700, mb: 3 }}
        >
          {t('upload.editManhwa')}
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
              {/* Основна інформація */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label={t('upload.title')}
                  variant="outlined"
                  name="title"
                  value={formData.title}
                  onChange={handleChange('title')}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  fullWidth
                  label={t('upload.description')}
                  variant="outlined"
                  name="description"
                  value={formData.description}
                  onChange={handleChange('description')}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                  multiline
                  rows={4}
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  fullWidth
                  label={t('upload.author')}
                  variant="outlined"
                  name="author"
                  value={formData.author}
                  onChange={handleChange('author')}
                  sx={{ mb: 3 }}
                />
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="status-label">{t('manhwa.status')}</InputLabel>
                  <Select
                    labelId="status-label"
                    value={formData.status}
                    label={t('manhwa.status')}
                    onChange={handleChange('status')}
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Autocomplete
                  multiple
                  options={availableGenres}
                  value={formData.genres}
                  onChange={handleGenresChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('manhwa.genre')}
                      variant="outlined"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  }
                  sx={{ mb: 3 }}
                />
                
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={formData.tags}
                  onChange={handleTagsChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('upload.tags')}
                      variant="outlined"
                      helperText={t('upload.tagsHelp')}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        color="secondary"
                        variant="outlined"
                      />
                    ))
                  }
                />
              </Grid>
              
              {/* Завантаження обкладинки */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('upload.cover')}
                </Typography>
                
                <input
                  accept="image/*"
                  id="cover-upload"
                  type="file"
                  hidden
                  onChange={handleCoverChange}
                />
                
                <label htmlFor="cover-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    {t('upload.changeCover')}
                  </Button>
                </label>
                
                {errors.cover && (
                  <FormHelperText error>{errors.cover}</FormHelperText>
                )}
                
                {coverPreview && (
                  <Card sx={{ mt: 2 }}>
                    <CardMedia
                      component="img"
                      image={coverPreview}
                      alt={t('upload.coverPreview')}
                      sx={{ height: 300, objectFit: 'contain' }}
                    />
                  </Card>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {t('upload.coverRequirements')}
                </Typography>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleOpenDeleteDialog}
                startIcon={<DeleteIcon />}
              >
                {t('common.delete')}
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<SaveIcon />}
                size="large"
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? t('common.loading') : t('common.save')}
              </Button>
            </Box>
          </form>
        </Paper>
        
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
        
        {/* Діалог підтвердження видалення */}
        <Dialog
          open={confirmDialog.open && confirmDialog.type === 'delete'}
          onClose={handleCloseDialog}
        >
          <DialogTitle>{t('upload.confirmDelete')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('upload.deleteWarning')}
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
            >
              {t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Діалог після оновлення */}
        <Dialog
          open={confirmDialog.open && confirmDialog.type === 'update'}
          onClose={() => handleAfterUpdate('')}
        >
          <DialogTitle>{t('upload.manhwaUpdated')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('upload.whatNext')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleAfterUpdate('view')} color="primary">
              {t('upload.viewManhwa')}
            </Button>
            <Button onClick={() => handleAfterUpdate('chapters')} color="secondary">
              {t('upload.manageChapters')}
            </Button>
            <Button onClick={() => handleAfterUpdate('dashboard')}>
              {t('upload.backToDashboard')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EditManhwa;