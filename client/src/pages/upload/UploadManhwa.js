// src/pages/upload/UploadManhwa.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CardMedia
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'react-query';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL;

const UploadManhwa = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    genres: [],
    tags: [],
    status: 'ongoing',
    language: 'en'
  });
  
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
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
  
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ua', label: 'Українська' },
    { value: 'ko', label: 'Korean' },
    { value: 'ja', label: 'Japanese' }
  ];
  
  // Мутація для створення нової манхви
  const uploadMutation = useMutation(
    (data) => {
      const formPayload = new FormData();
      
      // Додавання полів форми
      formPayload.append('title', data.title);
      formPayload.append('description', data.description);
      if (data.author) formPayload.append('author', data.author);
      formPayload.append('genres', JSON.stringify(data.genres));
      formPayload.append('tags', JSON.stringify(data.tags));
      formPayload.append('status', data.status);
      formPayload.append('language', data.language);
      
      // Додавання обкладинки
      if (data.coverImage) {
        formPayload.append('cover', data.coverImage);
      }
      
      return axios.post(`${API_URL}/user-manhwa`, formPayload, {
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
        
        // Перенаправлення на сторінку додавання глави
        setTimeout(() => {
          navigate(`/upload/chapter/${data.data.manhwa._id}`);
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
    
    if (!coverImage) {
      newErrors.cover = t('upload.coverRequired');
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
        coverImage
      });
    }
  };
  
  // Закриття повідомлення Snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
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
          {t('upload.createManhwa')}
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
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
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
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id="language-label">{t('upload.language')}</InputLabel>
                      <Select
                        labelId="language-label"
                        value={formData.language}
                        label={t('upload.language')}
                        onChange={handleChange('language')}
                      >
                        {languageOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
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
                    {t('upload.selectImage')}
                  </Button>
                </label>
                
                {errors.cover && (
                  <FormHelperText error>{errors.cover}</FormHelperText>
                )}
                
                {coverPreview ? (
                  <Card sx={{ mt: 2 }}>
                    <CardMedia
                      component="img"
                      image={coverPreview}
                      alt={t('upload.coverPreview')}
                      sx={{ height: 300, objectFit: 'contain' }}
                    />
                  </Card>
                ) : (
                  <Box
                    sx={{
                      height: 300,
                      border: '1px dashed',
                      borderColor: 'grey.400',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      mt: 2
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('upload.noCover')}
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {t('upload.coverRequirements')}
                </Typography>
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
                {uploadMutation.isLoading ? t('common.loading') : t('upload.createAndNext')}
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
            {t('upload.tips')}
          </Typography>
          
          <Typography variant="body2" paragraph>
            • {t('upload.tip1')}
          </Typography>
          <Typography variant="body2" paragraph>
            • {t('upload.tip2')}
          </Typography>
          <Typography variant="body2" paragraph>
            • {t('upload.tip3')}
          </Typography>
          <Typography variant="body2">
            • {t('upload.tip4')}
          </Typography>
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
      </Box>
    </Container>
  );
};

export default UploadManhwa;