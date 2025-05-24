// src/pages/upload/UploadDashboard.js
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Badge,
  Menu
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AddCircle as AddCircleIcon,
  MoreVert as MoreVertIcon,
  CloudUpload as UploadIcon,
  Book as BookIcon,
  FolderSpecial as FolderIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL;

const UploadDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedManhwa, setSelectedManhwa] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, manhwaId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Запит на отримання манхв користувача
  const { data, isLoading, error } = useQuery(
    ['userManhwas'],
    async () => {
      try {
        const response = await axios.get(`${API_URL}/user-manhwa`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  );
  
  // Мутація для видалення манхви
  const deleteMutation = useMutation(
    (manhwaId) => {
      return axios.delete(`${API_URL}/user-manhwa/${manhwaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userManhwas']);
        setSnackbar({
          open: true,
          message: t('upload.manhwaDeleted'),
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
  
  // Обробники подій
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleMenuOpen = (event, manhwa) => {
    setMenuAnchor(event.currentTarget);
    setSelectedManhwa(manhwa);
  };
  
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedManhwa(null);
  };
  
  const handleEdit = () => {
    handleMenuClose();
    navigate(`/upload/edit/${selectedManhwa._id}`);
  };
  
  const handleAddChapter = () => {
    handleMenuClose();
    navigate(`/upload/chapter/${selectedManhwa._id}`);
  };
  
  const handleDeleteConfirm = () => {
    handleMenuClose();
    setConfirmDialog({
      open: true,
      manhwaId: selectedManhwa._id
    });
  };
  
  const handleDelete = () => {
    deleteMutation.mutate(confirmDialog.manhwaId);
    setConfirmDialog({ open: false, manhwaId: null });
  };
  
  const handleCloseDialog = () => {
    setConfirmDialog({ open: false, manhwaId: null });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Фільтрація за статусом
  const filterManhwasByStatus = (status) => {
    if (!data || !data.manhwas) return [];
    return data.manhwas.filter(manhwa => manhwa.status === status);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'hiatus':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Форматування дати
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'PP');
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            className="gradient-text"
            sx={{ fontWeight: 700 }}
          >
            {t('upload.dashboard')}
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/upload/new"
          >
            {t('upload.newManhwa')}
          </Button>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error.response?.data?.message || t('common.error')}
          </Alert>
        ) : (
          <>
            {/* Статистика */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  elevation={2}
                  sx={{ p: 3, borderRadius: 2, height: '100%' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BookIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h6">
                      {t('upload.totalManhwas')}
                    </Typography>
                  </Box>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 600 }}>
                    {data?.manhwas?.length || 0}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  elevation={2}
                  sx={{ p: 3, borderRadius: 2, height: '100%' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FolderIcon color="secondary" sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h6">
                      {t('upload.totalChapters')}
                    </Typography>
                  </Box>
                  <Typography variant="h3" color="secondary" sx={{ fontWeight: 600 }}>
                    {data?.manhwas?.reduce((total, manhwa) => total + (manhwa.totalChapters || 0), 0) || 0}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  elevation={2}
                  sx={{ p: 3, borderRadius: 2, height: '100%' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <UploadIcon color="info" sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h6">
                      {t('upload.latestUpdate')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {data?.manhwas?.length > 0
                      ? formatDate(data.manhwas.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0].updatedAt)
                      : t('upload.noUpdates')}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Вкладки за статусами */}
            <Paper elevation={2} sx={{ mb: 4 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label={t('upload.allManhwas')} />
                <Tab label={t('manhwa.ongoing')} />
                <Tab label={t('manhwa.completed')} />
                <Tab label={t('manhwa.hiatus')} />
              </Tabs>
              
              <Box sx={{ p: 3 }}>
                {activeTab === 0 && (
                  data?.manhwas?.length > 0 ? (
                    <ManhwaGrid manhwas={data.manhwas} handleMenuOpen={handleMenuOpen} />
                  ) : (
                    <EmptyState />
                  )
                )}
                
                {activeTab === 1 && (
                  filterManhwasByStatus('ongoing').length > 0 ? (
                    <ManhwaGrid manhwas={filterManhwasByStatus('ongoing')} handleMenuOpen={handleMenuOpen} />
                  ) : (
                    <NoResultsState status="ongoing" />
                  )
                )}
                
                {activeTab === 2 && (
                  filterManhwasByStatus('completed').length > 0 ? (
                    <ManhwaGrid manhwas={filterManhwasByStatus('completed')} handleMenuOpen={handleMenuOpen} />
                  ) : (
                    <NoResultsState status="completed" />
                  )
                )}
                
                {activeTab === 3 && (
                  filterManhwasByStatus('hiatus').length > 0 ? (
                    <ManhwaGrid manhwas={filterManhwasByStatus('hiatus')} handleMenuOpen={handleMenuOpen} />
                  ) : (
                    <NoResultsState status="hiatus" />
                  )
                )}
              </Box>
            </Paper>
            
            {/* Меню дій для манхви */}
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEdit}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                {t('common.edit')}
              </MenuItem>
              
              <MenuItem onClick={handleAddChapter}>
                <AddCircleIcon fontSize="small" sx={{ mr: 1 }} />
                {t('upload.addChapter')}
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
      </Box>
    </Container>
  );
};

// Компонент для відображення сітки манхв
const ManhwaGrid = ({ manhwas, handleMenuOpen }) => {
  const { t } = useTranslation();
  
  return (
    <Grid container spacing={3}>
      {manhwas.map((manhwa) => (
        <Grid item xs={12} sm={6} md={4} key={manhwa._id}>
          <ManhwaCard manhwa={manhwa} onMenuOpen={handleMenuOpen} />
        </Grid>
      ))}
    </Grid>
  );
};

// Компонент картки манхви
const ManhwaCard = ({ manhwa, onMenuOpen }) => {
  const { t } = useTranslation();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'hiatus':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
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
        
        <Chip
          label={t(`manhwa.${manhwa.status}`)}
          color={getStatusColor(manhwa.status)}
          size="small"
          sx={{ position: 'absolute', top: 10, right: 10 }}
        />
        
        <Badge
          badgeContent={manhwa.totalChapters || 0}
          color="secondary"
          sx={{ position: 'absolute', bottom: 10, right: 10 }}
        >
          <Chip
            label={t('manhwa.chapters')}
            size="small"
            variant="outlined"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)' }}
          />
        </Badge>
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" gutterBottom noWrap>
            {manhwa.title}
          </Typography>
          
          <IconButton 
            size="small" 
            onClick={(e) => onMenuOpen(e, manhwa)}
            aria-label={t('common.actions')}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1,
            height: '3em'
          }}
        >
          {manhwa.description}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {manhwa.genres.slice(0, 2).map((genre, index) => (
            <Chip key={index} label={genre} size="small" variant="outlined" />
          ))}
          {manhwa.genres.length > 2 && (
            <Chip label={`+${manhwa.genres.length - 2}`} size="small" />
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary" display="block">
          {t('upload.lastUpdated')}: {new Date(manhwa.updatedAt).toLocaleDateString()}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          component={RouterLink}
          to={`/manhwa/${manhwa._id}`}
        >
          {t('common.view')}
        </Button>
        
        <Button
          size="small"
          variant="contained"
          color="secondary"
          startIcon={<AddCircleIcon />}
          component={RouterLink}
          to={`/upload/chapter/${manhwa._id}`}
        >
          {t('upload.addChapter')}
        </Button>
      </CardActions>
    </Card>
  );
};

// Компонент для відображення пустого стану
const EmptyState = () => {
  const { t } = useTranslation();
  
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 6
      }}
    >
      <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {t('upload.noManhwasYet')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('upload.startByCreating')}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        component={RouterLink}
        to="/upload/new"
      >
        {t('upload.createFirst')}
      </Button>
    </Box>
  );
};

// Компонент для відображення відсутності результатів за фільтром
const NoResultsState = ({ status }) => {
  const { t } = useTranslation();
  
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 4
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t('upload.noManhwasWithStatus', { status: t(`manhwa.${status}`) })}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('upload.changeStatusTip')}
      </Typography>
    </Box>
  );
};

export default UploadDashboard;