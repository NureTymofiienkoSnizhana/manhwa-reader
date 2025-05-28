import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getUserCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addManhwaToCategory,
  removeManhwaFromCategory,
} from '../../api/categoryService';
import { motion, AnimatePresence } from 'framer-motion';

const Categories = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State для діалогів та форм
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // Fetch user categories
  const { data: categoriesData, isLoading, error } = useQuery(
    'userCategories',
    async () => {
      try {
        return await getUserCategories();
      } catch (error) {
        // Mock дані якщо API не працює
        return getMockCategories();
      }
    },
    { staleTime: 300000 }
  );
  
  // Create category mutation
  const createCategoryMutation = useMutation(
    createCategory,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('userCategories');
        setSnackbar({
          open: true,
          message: data.message || t('categories.categoryCreated'),
          severity: 'success'
        });
        handleCloseCreateDialog();
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.message || t('common.error'),
          severity: 'error'
        });
      }
    }
  );
  
  // Update category mutation
  const updateCategoryMutation = useMutation(
    ({ categoryId, categoryData }) => updateCategory(categoryId, categoryData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userCategories');
        setSnackbar({
          open: true,
          message: t('categories.categoryUpdated'),
          severity: 'success'
        });
        handleCloseEditDialog();
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.message || t('common.error'),
          severity: 'error'
        });
      }
    }
  );
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation(
    deleteCategory,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userCategories');
        setSnackbar({
          open: true,
          message: t('categories.categoryDeleted'),
          severity: 'success'
        });
        handleCloseDeleteDialog();
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.message || t('common.error'),
          severity: 'error'
        });
      }
    }
  );
  
  const categories = categoriesData?.categories || [];
  
  // Handlers
  const handleOpenCreateDialog = () => {
    setFormData({ name: '', description: '' });
    setOpenCreateDialog(true);
  };
  
  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setFormData({ name: '', description: '' });
  };
  
  const handleOpenEditDialog = (category) => {
  setSelectedCategory(category);
  setFormData({
    name: category.name,
    description: category.description || ''
  });
  setOpenEditDialog(true);
  
  setMenuAnchor(null);
};
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
  };
  
  const handleOpenDeleteDialog = (category) => {
  setSelectedCategory(category);
  setOpenDeleteDialog(true);
  
  setMenuAnchor(null);
};
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedCategory(null);
  };
  
  const handleMenuOpen = (event, category) => {
    setMenuAnchor(event.currentTarget);
    setSelectedCategory(category);
  };
  
  const handleCloseMenu = () => {
  setMenuAnchor(null);
  
  if (!openEditDialog && !openDeleteDialog) {
    setSelectedCategory(null);
  }
};
  
  const handleFormChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };
  
  const handleCreateSubmit = () => {
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: t('categories.nameRequired'),
        severity: 'error'
      });
      return;
    }
    
    createCategoryMutation.mutate(formData);
  };
  
  const handleUpdateSubmit = () => {
  if (!formData.name.trim()) {
    setSnackbar({
      open: true,
      message: t('categories.nameRequired'),
      severity: 'error'
    });
    return;
  }
  
  if (!selectedCategory) {
    setSnackbar({
      open: true,
      message: 'Error: Category not selected',
      severity: 'error'
    });
    return;
  }
  
  updateCategoryMutation.mutate({
    categoryId: selectedCategory._id,
    categoryData: formData
  });
};
  
  const handleDeleteSubmit = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory._id);
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom className="gradient-text" sx={{ fontWeight: 700 }}>
              {t('categories.myCategories')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Організуйте свою колекцію манги по категоріям
            </Typography>
          </Box>
          
          <Fab
            color="primary"
            aria-label="add category"
            onClick={handleOpenCreateDialog}
            sx={{ ml: 2 }}
          >
            <AddIcon />
          </Fab>
        </Box>
        
        {/* Content */}
        {isLoading ? (
          <Grid container spacing={3}>
            {Array.from(new Array(6)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : categories.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('categories.noCategories')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('categories.createFirst')}
            </Typography>
            <Button
              variant="contained"
              onClick={handleOpenCreateDialog}
              size="large"
            >
              {t('categories.createNew')}
            </Button>
          </Paper>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3}>
              {categories.map((category) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={category._id}
                  component={motion.div}
                  variants={itemVariants}
                >
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <FolderIcon />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              component="h2"
                              noWrap
                              sx={{ fontWeight: 600 }}
                            >
                              {category.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {category.manhwas?.length || 0} {t('manhwa.manhwas')}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, category)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      {category.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 2,
                          }}
                        >
                          {category.description}
                        </Typography>
                      )}
                    </CardContent>
                    
                    <CardActions>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/categories/${category._id}`}
                      >
                        {t('common.view')}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleOpenEditDialog(category)}
                      >
                        {t('common.edit')}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
        
        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={() => handleOpenEditDialog(selectedCategory)}>
            <EditIcon sx={{ mr: 1 }} />
            {t('common.edit')}
          </MenuItem>
          <MenuItem
            onClick={() => handleOpenDeleteDialog(selectedCategory)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            {t('common.delete')}
          </MenuItem>
        </Menu>
        
        {/* Create Category Dialog */}
        <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{t('categories.createNew')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('categories.categoryName')}
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleFormChange('name')}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label={t('categories.description')}
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={handleFormChange('description')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateSubmit}
              variant="contained"
              disabled={createCategoryMutation.isLoading}
            >
              {createCategoryMutation.isLoading ? t('common.loading') : t('common.create')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Edit Category Dialog */}
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{t('categories.editCategory')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('categories.categoryName')}
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleFormChange('name')}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label={t('categories.description')}
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={handleFormChange('description')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateSubmit}
              variant="contained"
              disabled={updateCategoryMutation.isLoading}
            >
              {updateCategoryMutation.isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>{t('categories.deleteCategory')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('categories.confirmDelete')} "{selectedCategory?.name}"?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('categories.thisCantBeUndone')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDeleteSubmit}
              color="error"
              variant="contained"
              disabled={deleteCategoryMutation.isLoading}
            >
              {deleteCategoryMutation.isLoading ? t('common.loading') : t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

// Mock data function
const getMockCategories = () => ({
  categories: [
    {
      _id: 'cat-1',
      name: 'Екшн',
      description: 'Захоплюючі бойовики з динамічним сюжетом',
      manhwas: [
        { manhwaId: 'solo-leveling', title: 'Solo Leveling', coverImage: '' },
        { manhwaId: 'tower-of-god', title: 'Tower of God', coverImage: '' },
        { manhwaId: 'god-of-high-school', title: 'The God of High School', coverImage: '' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'cat-2',
      name: 'Романтика',
      description: 'Любовні історії та романтичні пригоди',
      manhwas: [
        { manhwaId: 'romance-1', title: 'True Beauty', coverImage: '' },
        { manhwaId: 'romance-2', title: 'Cheese in the Trap', coverImage: '' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'cat-3',
      name: 'Фентезі',
      description: 'Магічні світи та фантастичні пригоди',
      manhwas: [
        { manhwaId: 'fantasy-1', title: 'The Beginning After The End', coverImage: '' },
        { manhwaId: 'fantasy-2', title: 'Omniscient Reader', coverImage: '' },
        { manhwaId: 'fantasy-3', title: 'Eleceed', coverImage: '' },
        { manhwaId: 'fantasy-4', title: 'Noblesse', coverImage: '' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
});

export default Categories;