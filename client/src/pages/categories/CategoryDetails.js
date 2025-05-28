import React, { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getUserCategories, 
  updateCategory, 
  removeManhwaFromCategory,
  addManhwaToCategory
} from '../../api/categoryService';
import { searchManhwas } from '../../api/manhwaService';
import ManhwaCard from '../../components/common/ManhwaCard';
import { motion } from 'framer-motion';

const CategoryDetails = () => {
  const { categoryId } = useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State for dialogs and forms
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addManhwaDialogOpen, setAddManhwaDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [manhwaToRemove, setManhwaToRemove] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // Fetch categories data to find the specific category
  const { data: categoriesData, isLoading, error } = useQuery(
    'userCategories',
    getUserCategories,
    { 
      staleTime: 60000, // 1 minute
    }
  );
  
  // Find the specific category from the fetched data
  const category = categoriesData?.categories?.find(cat => cat._id === categoryId);
  
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
  
  // Update category mutation
  const updateCategoryMutation = useMutation(
    (data) => updateCategory(categoryId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userCategories');
        setEditDialogOpen(false);
      }
    }
  );
  
  // Add manhwa mutation
  const addManhwaMutation = useMutation(
    (manhwaId) => addManhwaToCategory(categoryId, manhwaId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userCategories');
      }
    }
  );
  
  // Remove manhwa mutation
  const removeManhwaMutation = useMutation(
    (manhwaId) => removeManhwaFromCategory(categoryId, manhwaId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userCategories');
        setConfirmDialogOpen(false);
        setManhwaToRemove(null);
      }
    }
  );
  
  // Search manhwas for adding to category
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const results = await searchManhwas(searchQuery, 10, 0);
        setSearchResults(results.manga || []);
      } catch (error) {
        console.error('Error searching manhwas:', error);
        setSearchResults([]);
      }
    }
  };
  
  // Open edit dialog
  const handleOpenEditDialog = () => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      });
      setEditDialogOpen(true);
    }
  };
  
  // Handle form change
  const handleFormChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };
  
  // Submit edit form
  const handleEditSubmit = () => {
    updateCategoryMutation.mutate(formData);
  };
  
  // Open confirmation dialog for removing manhwa
  const handleConfirmRemove = (manhwaId) => {
    setManhwaToRemove(manhwaId);
    setConfirmDialogOpen(true);
  };
  
  // Confirm and remove manhwa
  const handleRemoveManhwa = () => {
    if (manhwaToRemove) {
      removeManhwaMutation.mutate(manhwaToRemove);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Error state
  if (error || !categoriesData) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          {t('common.error')}
        </Alert>
      </Container>
    );
  }
  
  // Category not found
  if (!category) {
    return (
      <Container>
        <Alert severity="warning" sx={{ my: 4 }}>
          {t('categories.categoryNotFound')}
        </Alert>
        <Button 
          component={RouterLink} 
          to="/categories" 
          startIcon={<ArrowBackIcon />}
        >
          {t('common.back')}
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Button 
              component={RouterLink} 
              to="/categories" 
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 2 }}
            >
              {t('common.back')}
            </Button>
            <Typography variant="h4" component="h1" gutterBottom className="gradient-text" sx={{ fontWeight: 700 }}>
              {category.name}
            </Typography>
            {category.description && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {category.description}
              </Typography>
            )}
            <Chip 
              label={`${category.manhwas?.length || 0} ${t('manhwa.manhwas')}`} 
              color="primary" 
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenEditDialog}
              sx={{ mr: 2 }}
            >
              {t('common.edit')}
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Manhwas list */}
        {category.manhwas && category.manhwas.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3}>
              {category.manhwas.map((manhwa) => (
                <Grid 
                  size={{ xs: 12, sm: 6, md: 4 }} 
                  key={manhwa.manhwaId}
                  component={motion.div}
                  variants={itemVariants}
                >
                  <Box sx={{ position: 'relative' }}>
                    <ManhwaCard 
                      manhwa={{
                        id: manhwa.manhwaId,
                        title: manhwa.title,
                        coverImage: manhwa.coverImage,
                      }}
                    />
                    <IconButton
                      color="error"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'white'
                        }
                      }}
                      onClick={() => handleConfirmRemove(manhwa.manhwaId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {t('categories.noManhwas')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddManhwaDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              {t('categories.addManhwa')}
            </Button>
          </Paper>
        )}
      </Box>
      
      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setEditDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={updateCategoryMutation.isLoading}
          >
            {updateCategoryMutation.isLoading ? t('common.loading') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Manhwa Dialog */}
      <Dialog 
        open={addManhwaDialogOpen} 
        onClose={() => {
          setAddManhwaDialogOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('categories.addManhwa')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              label={t('common.search')}
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
            >
              {t('common.search')}
            </Button>
          </Box>
          
          {searchResults.length > 0 ? (
            <Grid container spacing={2}>
              {searchResults.map((manhwa) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.id}>
                  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <Box
                      component="img"
                      src={manhwa.coverImage || '/placeholder-cover.jpg'}
                      alt={manhwa.title}
                      sx={{ width: 60, height: 80, objectFit: 'cover', mr: 2 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" noWrap>
                        {manhwa.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {manhwa.author || 'Unknown author'}
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => addManhwaMutation.mutate(manhwa.id)}
                      disabled={
                        addManhwaMutation.isLoading || 
                        category.manhwas.some(m => m.manhwaId === manhwa.id)
                      }
                    >
                      {category.manhwas.some(m => m.manhwaId === manhwa.id) 
                        ? t('common.added')
                        : t('common.add')}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : searchQuery ? (
            <Typography sx={{ textAlign: 'center', my: 2 }}>
              {t('common.noResults')}
            </Typography>
          ) : (
            <Typography sx={{ textAlign: 'center', my: 2 }}>
              {t('common.startSearch')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddManhwaDialogOpen(false);
            setSearchQuery('');
            setSearchResults([]);
          }}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>{t('categories.removeManhwa')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('categories.confirmDelete')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('common.thisCantBeUndone')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleRemoveManhwa}
            color="error"
            variant="contained"
            disabled={removeManhwaMutation.isLoading}
          >
            {removeManhwaMutation.isLoading ? t('common.loading') : t('common.remove')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoryDetails;