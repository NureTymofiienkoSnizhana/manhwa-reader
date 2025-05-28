import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  TextField,
  Box,
  Typography,
  Divider,
  Chip,
  Alert,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Folder as FolderIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getUserCategories, 
  addManhwaToCategory, 
  removeManhwaFromCategory,
  createCategory 
} from '../../api/categoryService';

const CategorySelector = ({ 
  open, 
  onClose, 
  manhwaId, 
  manhwaTitle, 
  manhwaCover,
  isUserManhwa = false
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  // Fetch user categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    'userCategories',
    getUserCategories,
    { 
      enabled: open,
      staleTime: 300000 
    }
  );
  
  const categories = categoriesData?.categories || [];
  
  // Find categories that already contain this manhwa
  React.useEffect(() => {
    if (categories.length > 0 && manhwaId) {
      const containingCategories = new Set();
      categories.forEach(category => {
        const isInCategory = category.manhwas?.some(m => 
          m.manhwaId === manhwaId || m.manhwaId === String(manhwaId)
        );
        if (isInCategory) {
          containingCategories.add(category._id);
        }
      });
      setSelectedCategories(containingCategories);
    }
  }, [categories, manhwaId]);
  
  // Create category mutation
  const createCategoryMutation = useMutation(
    createCategory,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('userCategories');
        setAlert({
          type: 'success',
          message: data.message || t('categories.categoryCreated')
        });
        setNewCategoryName('');
        setNewCategoryDescription('');
        setShowCreateNew(false);
        
        // Automatically select the new category
        if (data.category && data.category._id) {
          setSelectedCategories(prev => new Set([...prev, data.category._id]));
        }
      },
      onError: (error) => {
        setAlert({
          type: 'error',
          message: error.message || t('common.error')
        });
      }
    }
  );
  
  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };
  
  // Handle create new category
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      setAlert({
        type: 'error',
        message: t('categories.nameRequired')
      });
      return;
    }
    
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim()
    });
  };
  
  // Handle save changes
  const handleSave = async () => {
    setIsLoading(true);
    setAlert({ type: '', message: '' });
    
    try {
      const promises = [];
      const currentCategories = new Set();
      
      // Find categories that currently contain this manhwa
      categories.forEach(category => {
        const isInCategory = category.manhwas?.some(m => 
          m.manhwaId === manhwaId || m.manhwaId === String(manhwaId)
        );
        if (isInCategory) {
          currentCategories.add(category._id);
        }
      });
      
      // Categories to add to
      const toAdd = [...selectedCategories].filter(id => !currentCategories.has(id));
      
      // Categories to remove from
      const toRemove = [...currentCategories].filter(id => !selectedCategories.has(id));
      
      // Add to new categories
      for (const categoryId of toAdd) {
        promises.push(
          addManhwaToCategory(categoryId, manhwaId)
        );
      }
      
      // Remove from deselected categories
      for (const categoryId of toRemove) {
        promises.push(
          removeManhwaFromCategory(categoryId, manhwaId)
        );
      }
      
      await Promise.all(promises);
      
      // Refresh categories data
      queryClient.invalidateQueries('userCategories');
      
      setAlert({
        type: 'success',
        message: t('categories.categoriesUpdated')
      });
      
      // Close dialog after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || t('common.error')
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset state when dialog closes
  const handleClose = () => {
    setAlert({ type: '', message: '' });
    setShowCreateNew(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('categories.addToCategories')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {manhwaTitle}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {alert.message && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 2 }}
            onClose={() => setAlert({ type: '', message: '' })}
          >
            {alert.message}
          </Alert>
        )}
        
        {categoriesLoading ? (
          <Typography>{t('common.loading')}</Typography>
        ) : categories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('categories.noCategories')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('categories.createFirst')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {categories.map((category) => (
              <ListItem 
                key={category._id} 
                dense 
                button 
                onClick={() => handleCategoryToggle(category._id)}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedCategories.has(category._id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText
                  primary={category.name}
                  secondary={`${category.manhwas?.length || 0} manhwas`}
                />
              </ListItem>
            ))}
          </List>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Create new category section */}
        <Box>
          <Button
            startIcon={showCreateNew ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowCreateNew(!showCreateNew)}
            sx={{ mb: 1 }}
          >
            {t('categories.createNew')}
          </Button>
          
          <Collapse in={showCreateNew}>
            <Box sx={{ pl: 2 }}>
              <TextField
                fullWidth
                size="small"
                label={t('categories.categoryName')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                size="small"
                label={t('categories.description')}
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleCreateCategory}
                disabled={createCategoryMutation.isLoading}
                startIcon={<AddIcon />}
              >
                {createCategoryMutation.isLoading ? t('common.loading') : t('common.create')}
              </Button>
            </Box>
          </Collapse>
        </Box>
        
        {/* Selected categories preview */}
        {selectedCategories.size > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('categories.selectedCategories')}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[...selectedCategories].map(categoryId => {
                const category = categories.find(c => c._id === categoryId);
                return category ? (
                  <Chip
                    key={categoryId}
                    label={category.name}
                    size="small"
                    onDelete={() => handleCategoryToggle(categoryId)}
                  />
                ) : null;
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategorySelector;