import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  Home as HomeIcon,
  ViewList as BrowseIcon,
  Bookmarks as LibraryIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  AccountCircle as ProfileIcon,
  Dashboard as AdminIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  
  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing(1),
        }}
      >
        <Typography variant="h6" component="div" sx={{ padding: theme.spacing(1, 2) }}>
          {t('app.title')}
        </Typography>
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
        <ListItem 
          button 
          component={Link} 
          to="/" 
          selected={isActive('/')}
          onClick={onClose}
        >
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav.home')} />
        </ListItem>
        
        <ListItem 
          button 
          component={Link} 
          to="/browse" 
          selected={isActive('/browse')}
          onClick={onClose}
        >
          <ListItemIcon>
            <BrowseIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav.browse')} />
        </ListItem>
        
        {isAuthenticated && (
          <>
            <ListItem 
              button 
              component={Link} 
              to="/my-library" 
              selected={isActive('/my-library')}
              onClick={onClose}
            >
              <ListItemIcon>
                <LibraryIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.myLibrary')} />
            </ListItem>
            
            <ListItem 
              button 
              component={Link} 
              to="/categories" 
              selected={isActive('/categories')}
              onClick={onClose}
            >
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.categories')} />
            </ListItem>
          </>
        )}
      </List>
      
      <Divider />
      
      <List>
        {isAuthenticated ? (
          <>
            <ListItem 
              button 
              component={Link} 
              to="/profile" 
              selected={isActive('/profile')}
              onClick={onClose}
            >
              <ListItemIcon>
                <ProfileIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.profile')} />
            </ListItem>
            
            <ListItem 
              button 
              component={Link} 
              to="/settings" 
              selected={isActive('/settings')}
              onClick={onClose}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.settings')} />
            </ListItem>
            
            {user && user.role === 'admin' && (
              <ListItem 
                button 
                component={Link} 
                to="/admin" 
                selected={isActive('/admin')}
                onClick={onClose}
              >
                <ListItemIcon>
                  <AdminIcon />
                </ListItemIcon>
                <ListItemText primary={t('admin.dashboard')} />
              </ListItem>
            )}
          </>
        ) : (
          <>
            <ListItem 
              button 
              component={Link} 
              to="/login" 
              selected={isActive('/login')}
              onClick={onClose}
            >
              <ListItemIcon>
                <ProfileIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.login')} />
            </ListItem>
            
            <ListItem 
              button 
              component={Link} 
              to="/register" 
              selected={isActive('/register')}
              onClick={onClose}
            >
              <ListItemIcon>
                <ProfileIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.register')} />
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;