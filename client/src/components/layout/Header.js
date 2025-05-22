import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Box,
  useMediaQuery,
  Divider
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
  Notifications,
  Translate,
  Logout
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';

// Search input styling
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

// Brand logo with animation
const BrandLogo = styled(motion.div)({
  display: 'flex',
  alignItems: 'center',
});

const Header = ({ toggleSidebar }) => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'));
  
  const [searchValue, setSearchValue] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleLangMenuOpen = (event) => {
    setLangMenuAnchor(event.currentTarget);
  };
  
  const handleLangMenuClose = () => {
    setLangMenuAnchor(null);
  };
  
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    handleLangMenuClose();
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };
  
  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <BrandLogo
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {t('app.title')}
            </Typography>
          </Link>
        </BrandLogo>
        
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={t('nav.search')}
              inputProps={{ 'aria-label': 'search' }}
              value={searchValue}
              onChange={handleSearchChange}
            />
          </Search>
        </Box>
        
        {/* Theme toggle */}
        <IconButton color="inherit" onClick={toggleTheme}>
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        
        {/* Language menu */}
        <IconButton color="inherit" onClick={handleLangMenuOpen}>
          <Translate />
        </IconButton>
        <Menu
          anchorEl={langMenuAnchor}
          open={Boolean(langMenuAnchor)}
          onClose={handleLangMenuClose}
        >
          <MenuItem 
            onClick={() => handleLanguageChange('en')}
            selected={language === 'en'}
          >
            English
          </MenuItem>
          <MenuItem 
            onClick={() => handleLanguageChange('ua')}
            selected={language === 'ua'}
          >
            Українська
          </MenuItem>
        </Menu>
        
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
            
            {/* User menu */}
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              {user.profilePic ? (
                <Avatar 
                  alt={user.username} 
                  src={user.profilePic} 
                  sx={{ width: 32, height: 32 }} 
                />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              keepMounted
            >
              <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>
                {t('nav.profile')}
              </MenuItem>
              <MenuItem component={Link} to="/my-library" onClick={handleUserMenuClose}>
                {t('nav.myLibrary')}
              </MenuItem>
              <MenuItem component={Link} to="/settings" onClick={handleUserMenuClose}>
                {t('nav.settings')}
              </MenuItem>
              
              {user.role === 'admin' && (
                <MenuItem component={Link} to="/admin" onClick={handleUserMenuClose}>
                  {t('admin.dashboard')}
                </MenuItem>
              )}
              
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1, fontSize: 20 }} />
                {t('nav.logout')}
              </MenuItem>
            </Menu>
          </>
        ) : (
          !isMobile ? (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login"
              >
                {t('nav.login')}
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                component={Link} 
                to="/register"
                sx={{ ml: 1 }}
              >
                {t('nav.register')}
              </Button>
            </>
          ) : (
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
            >
              <AccountCircle />
            </IconButton>
          )
        )}
        
        {/* Guest menu for mobile */}
        {!isAuthenticated && isMobile && (
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
          >
            <MenuItem component={Link} to="/login" onClick={handleUserMenuClose}>
              {t('nav.login')}
            </MenuItem>
            <MenuItem component={Link} to="/register" onClick={handleUserMenuClose}>
              {t('nav.register')}
            </MenuItem>
          </Menu>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;