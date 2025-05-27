import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Alert,
  Snackbar,
  Slider,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon,
  Storage as StorageIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  VolumeUp as VolumeIcon,
  Speed as SpeedIcon,
  AutoAwesome as AutoAwesomeIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const queryClient = useQueryClient();
  
  // Local state
  const [settings, setSettings] = useState({
    // Appearance
    darkMode: darkMode,
    language: language,
    fontSize: 'medium',
    
    // Notifications
    newChapters: true,
    recommendations: true,
    systemMessages: true,
    emailNotifications: false,
    pushNotifications: true,
    
    // Reading
    readingSpeed: 2,
    autoBookmark: true,
    showReadingProgress: true,
    soundEffects: true,
    
    // Privacy
    profileVisibility: 'public',
    showReadingActivity: true,
    showLibrary: true,
    
    // Data
    autoSync: true,
    cacheSize: 500, // MB
  });
  
  // Dialog states
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openDeleteAccount, setOpenDeleteAccount] = useState(false);
  const [openExportData, setOpenExportData] = useState(false);
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
  });
  
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Mutations
  const changePasswordMutation = useMutation(
    (passwordData) => {
      return axios.put(`${API_URL}/auth/change-password`, passwordData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: t('settings.passwordChanged'),
          severity: 'success'
        });
        setOpenChangePassword(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          showCurrentPassword: false,
          showNewPassword: false,
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

  const updateProfileMutation = useMutation(
    (profileData) => {
      return axios.put(`${API_URL}/auth/update-profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    {
      onSuccess: (data) => {
        updateUser(data.data.user);
        queryClient.invalidateQueries('userProfile');
        setSnackbar({
          open: true,
          message: t('settings.profileUpdated'),
          severity: 'success'
        });
        setOpenEditProfile(false);
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
  
  // Handlers
  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Apply changes immediately for certain settings
    if (setting === 'darkMode') {
      toggleTheme();
    } else if (setting === 'language') {
      changeLanguage(value);
    }
    
    // Show success message
    setSnackbar({
      open: true,
      message: t('settings.settingSaved'),
      severity: 'success'
    });
  };

  const handleOpenEditProfile = () => {
    setProfileForm({
      username: user.username,
      email: user.email,
    });
    setOpenEditProfile(true);
  };

  const handleProfileChange = (field) => (event) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleProfileSubmit = () => {
    if (!profileForm.username.trim()) {
      setSnackbar({
        open: true,
        message: t('auth.usernameRequired'),
        severity: 'error'
      });
      return;
    }

    if (!profileForm.email.trim() || !/\S+@\S+\.\S+/.test(profileForm.email)) {
      setSnackbar({
        open: true,
        message: t('auth.validEmail'),
        severity: 'error'
      });
      return;
    }

    updateProfileMutation.mutate(profileForm);
  };
  
  const handlePasswordChange = (field) => (event) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };
  
  const handlePasswordSubmit = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({
        open: true,
        message: t('auth.passwordsMatch'),
        severity: 'error'
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: t('auth.passwordLength'),
        severity: 'error'
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };
  
  const handleExportData = () => {
    const userData = {
      profile: user,
      settings: settings,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `manhwa-reader-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: t('settings.dataExported'),
      severity: 'success'
    });
    
    setOpenExportData(false);
  };
  
  const handleClearCache = () => {
    // Mock cache clearing
    setSnackbar({
      open: true,
      message: t('settings.cacheCleared'),
      severity: 'success'
    });
  };
  
  const handleResetSettings = () => {
    setSettings({
      darkMode: false,
      language: 'en',
      fontSize: 'medium',
      newChapters: true,
      recommendations: true,
      systemMessages: true,
      emailNotifications: false,
      pushNotifications: true,
      readingSpeed: 2,
      autoBookmark: true,
      showReadingProgress: true,
      soundEffects: true,
      profileVisibility: 'public',
      showReadingActivity: true,
      showLibrary: true,
      autoSync: true,
      cacheSize: 500,
    });
    
    setSnackbar({
      open: true,
      message: t('settings.settingsReset'),
      severity: 'info'
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            className="gradient-text"
            sx={{ fontWeight: 700 }}
          >
            {t('nav.settings')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('settings.customizeApp')}
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {/* Appearance Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PaletteIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6">{t('settings.appearance')}</Typography>
                  </Box>
                  
                  <List disablePadding>
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.darkMode')}
                        secondary={t('settings.darkModeDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.darkMode}
                          onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.language')}
                        secondary={t('settings.languageDesc')}
                      />
                      <ListItemSecondaryAction>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={settings.language}
                            onChange={(e) => handleSettingChange('language', e.target.value)}
                          >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="ua">Українська</MenuItem>
                          </Select>
                        </FormControl>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.fontSize')}
                        secondary={t('settings.fontSizeDesc')}
                      />
                      <ListItemSecondaryAction>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={settings.fontSize}
                            onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                          >
                            <MenuItem value="small">{t('settings.small')}</MenuItem>
                            <MenuItem value="medium">{t('settings.medium')}</MenuItem>
                            <MenuItem value="large">{t('settings.large')}</MenuItem>
                          </Select>
                        </FormControl>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Notification Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <NotificationsIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6">{t('settings.notifications')}</Typography>
                  </Box>
                  
                  <List disablePadding>
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.newChapters')}
                        secondary={t('settings.newChaptersDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.newChapters}
                          onChange={(e) => handleSettingChange('newChapters', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.recommendations')}
                        secondary={t('settings.recommendationsDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.recommendations}
                          onChange={(e) => handleSettingChange('recommendations', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.emailNotifications')}
                        secondary={t('settings.emailNotificationsDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Reading Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <SpeedIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6">{t('settings.reading')}</Typography>
                  </Box>
                  
                  <List disablePadding>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <ListItemText 
                        primary={t('settings.readingSpeed')}
                        secondary={t('settings.readingSpeedDesc')}
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ px: 2 }}>
                        <Slider
                          value={settings.readingSpeed}
                          onChange={(e, value) => handleSettingChange('readingSpeed', value)}
                          min={1}
                          max={5}
                          step={1}
                          marks={[
                            { value: 1, label: t('settings.slow') },
                            { value: 3, label: t('settings.normal') },
                            { value: 5, label: t('settings.fast') }
                          ]}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.autoBookmark')}
                        secondary={t('settings.autoBookmarkDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.autoBookmark}
                          onChange={(e) => handleSettingChange('autoBookmark', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.soundEffects')}
                        secondary={t('settings.soundEffectsDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.soundEffects}
                          onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Privacy Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <SecurityIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6">{t('settings.privacy')}</Typography>
                  </Box>
                  
                  <List disablePadding>
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.profileVisibility')}
                        secondary={t('settings.profileVisibilityDesc')}
                      />
                      <ListItemSecondaryAction>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={settings.profileVisibility}
                            onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                          >
                            <MenuItem value="public">{t('settings.public')}</MenuItem>
                            <MenuItem value="friends">{t('settings.friendsOnly')}</MenuItem>
                            <MenuItem value="private">{t('settings.private')}</MenuItem>
                          </Select>
                        </FormControl>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.showReadingActivity')}
                        secondary={t('settings.showReadingActivityDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.showReadingActivity}
                          onChange={(e) => handleSettingChange('showReadingActivity', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('settings.showLibrary')}
                        secondary={t('settings.showLibraryDesc')}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.showLibrary}
                          onChange={(e) => handleSettingChange('showLibrary', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Account Settings */}
          <Grid size={{ xs: 12 }} >
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AccountIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6">{t('settings.account')}</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleOpenEditProfile}
                        startIcon={<EditIcon />}
                      >
                        {t('profile.editProfile')}
                      </Button>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setOpenChangePassword(true)}
                      >
                        {t('settings.changePassword')}
                      </Button>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setOpenExportData(true)}
                        startIcon={<DownloadIcon />}
                      >
                        {t('settings.exportData')}
                      </Button>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleResetSettings}
                        startIcon={<RestoreIcon />}
                      >
                        {t('settings.resetSettings')}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Storage Settings */}
          <Grid size={{ xs: 12 }} >
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <StorageIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6">{t('settings.storage')}</Typography>
                  </Box>
                  
                  <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('settings.cacheUsage')}
                        </Typography>
                        <Typography variant="h6">
                          {settings.cacheSize} MB / 1 GB
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={handleClearCache}
                          sx={{ mt: 1 }}
                        >
                          {t('settings.clearCache')}
                        </Button>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.autoSync}
                            onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
                          />
                        }
                        label={t('settings.autoSync')}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t('settings.autoSyncDesc')}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          icon={<InfoIcon />}
                          label={`${t('profile.level')} ${user?.level || 1}`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip 
                          icon={<AutoAwesomeIcon />}
                          label={`${user?.experience || 0} XP`}
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* Edit Profile Dialog */}
        <Dialog open={openEditProfile} onClose={() => setOpenEditProfile(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label={t('auth.username')}
              type="text"
              fullWidth
              variant="outlined"
              value={profileForm.username}
              onChange={handleProfileChange('username')}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label={t('auth.email')}
              type="email"
              fullWidth
              variant="outlined"
              value={profileForm.email}
              onChange={handleProfileChange('email')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditProfile(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleProfileSubmit} 
              variant="contained"
              disabled={updateProfileMutation.isLoading}
            >
              {updateProfileMutation.isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Change Password Dialog */}
        <Dialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('settings.changePassword')}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label={t('auth.currentPassword')}
              type={passwordForm.showCurrentPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange('currentPassword')}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setPasswordForm(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                    edge="end"
                  >
                    {passwordForm.showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            
            <TextField
              margin="dense"
              label={t('auth.newPassword')}
              type={passwordForm.showNewPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange('newPassword')}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setPasswordForm(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                    edge="end"
                  >
                    {passwordForm.showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            
            <TextField
              margin="dense"
              label={t('auth.confirmPassword')}
              type="password"
              fullWidth
              variant="outlined"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenChangePassword(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handlePasswordSubmit} 
              variant="contained"
              disabled={changePasswordMutation.isLoading}
            >
              {changePasswordMutation.isLoading ? t('common.loading') : t('settings.changePassword')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Export Data Dialog */}
        <Dialog open={openExportData} onClose={() => setOpenExportData(false)}>
          <DialogTitle>{t('settings.exportData')}</DialogTitle>
          <DialogContent>
            <Typography paragraph>
              {t('settings.exportDataDesc')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.exportDataInfo')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenExportData(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleExportData} variant="contained" startIcon={<DownloadIcon />}>
              {t('settings.export')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Account Dialog */}
        <Dialog open={openDeleteAccount} onClose={() => setOpenDeleteAccount(false)}>
          <DialogTitle sx={{ color: 'error.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ mr: 1 }} />
              {t('settings.deleteAccount')}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('settings.deleteAccountWarning')}
            </Alert>
            <Typography paragraph>
              {t('settings.deleteAccountDesc')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.deleteAccountInfo')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteAccount(false)}>
              {t('common.cancel')}
            </Button>
            <Button color="error" variant="contained" startIcon={<DeleteIcon />}>
              {t('settings.confirmDelete')}
            </Button>  
          </DialogActions>
        </Dialog>
        
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Settings;