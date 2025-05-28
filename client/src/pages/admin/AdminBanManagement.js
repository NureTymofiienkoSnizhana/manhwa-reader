import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Block,
  RestoreFromTrash,
  Person,
  History,
  Search,
  Add
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getActiveBans, 
  getBanHistory, 
  banUser, 
  unbanUser,
  searchUsers
} from '../../api/adminService';

const AdminBanManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banForm, setBanForm] = useState({
    reason: '',
    banDuration: '1d'
  });
  
  // Отримання активних банів
  const { 
    data: activeBansData, 
    isLoading: activeBansLoading 
  } = useQuery('activeBans', getActiveBans, {
    enabled: activeTab === 0
  });
  
  // Отримання історії банів
  const { 
    data: banHistoryData, 
    isLoading: banHistoryLoading 
  } = useQuery('banHistory', getBanHistory, {
    enabled: activeTab === 1
  });
  
  // Мутація для бану користувача
  const banUserMutation = useMutation(banUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('activeBans');
      queryClient.invalidateQueries('banHistory');
      setBanDialogOpen(false);
      resetBanForm();
    }
  });
  
  // Мутація для розбану користувача
  const unbanUserMutation = useMutation(unbanUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('activeBans');
      queryClient.invalidateQueries('banHistory');
    }
  });
  
  // Зміна вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Відкрити діалог бану
  const handleOpenBanDialog = (user = null) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };
  
  // Закрити діалог бану
  const handleCloseBanDialog = () => {
    setBanDialogOpen(false);
    resetBanForm();
  };
  
  // Скинути форму бану
  const resetBanForm = () => {
    setBanForm({
      reason: '',
      banDuration: '1d'
    });
    setSelectedUser(null);
    setSearchTerm('');
    setSearchResults([]);
  };
  
  // Змінити форму бану
  const handleBanFormChange = (field) => (event) => {
    setBanForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };
  
  // Відправити форму бану
  const handleBanSubmit = () => {
    if (!selectedUser || !banForm.reason || !banForm.banDuration) {
      return;
    }
    
    banUserMutation.mutate({
      userId: selectedUser.id,
      reason: banForm.reason,
      banDuration: banForm.banDuration
    });
  };
  
  // Розбан користувача
  const handleUnban = (userId) => {
    unbanUserMutation.mutate(userId);
  };
  
  // Пошук користувачів
  const handleSearchUsers = async () => {
    if (searchTerm.trim().length < 2) return;
    
    try {
      const data = await searchUsers(searchTerm);
      setSearchResults(data.users);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };
  
  // Обробка вибору користувача з результатів пошуку
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
  };
  
  // Форматування дати
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Отримання тексту для тривалості бану
  const getBanDurationText = (duration) => {
    switch(duration) {
      case '1d': return '1 day';
      case '3d': return '3 days';
      case '7d': return '1 week';
      case '30d': return '30 days';
      case 'permanent': return 'Permanent';
      default: return duration;
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('admin.banManagement')}
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<Block />}
            onClick={() => handleOpenBanDialog()}
            color="error"
          >
            {t('admin.banUser')}
          </Button>
        </Box>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={t('admin.activeBans')} icon={<Block />} />
            <Tab label={t('admin.banHistory')} icon={<History />} />
          </Tabs>
          
          {/* Active Bans Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              {activeBansLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : activeBansData?.bans?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('admin.user')}</TableCell>
                        <TableCell>{t('admin.reason')}</TableCell>
                        <TableCell>{t('admin.bannedBy')}</TableCell>
                        <TableCell>{t('admin.bannedOn')}</TableCell>
                        <TableCell>{t('admin.bannedUntil')}</TableCell>
                        <TableCell>{t('admin.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeBansData.bans.map((ban) => (
                        <TableRow key={ban._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={ban.user.profilePic} 
                                sx={{ mr: 1, width: 32, height: 32 }}
                              >
                                {ban.user.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {ban.user.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {ban.user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{ban.reason}</TableCell>
                          <TableCell>{ban.bannedBy.username}</TableCell>
                          <TableCell>{formatDate(ban.createdAt)}</TableCell>
                          <TableCell>
                            {new Date(ban.bannedUntil).getFullYear() > 2050 
                              ? 'Permanent' 
                              : formatDate(ban.bannedUntil)
                            }
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('admin.unban')}>
                              <IconButton 
                                color="primary"
                                onClick={() => handleUnban(ban.user._id)}
                              >
                                <RestoreFromTrash />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ m: 2 }}>
                  {t('admin.noActiveBans')}
                </Alert>
              )}
            </Box>
          )}
          
          {/* Ban History Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              {banHistoryLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : banHistoryData?.bans?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('admin.user')}</TableCell>
                        <TableCell>{t('admin.reason')}</TableCell>
                        <TableCell>{t('admin.bannedBy')}</TableCell>
                        <TableCell>{t('admin.bannedOn')}</TableCell>
                        <TableCell>{t('admin.bannedUntil')}</TableCell>
                        <TableCell>{t('admin.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {banHistoryData.bans.map((ban) => (
                        <TableRow key={ban._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={ban.user.profilePic} 
                                sx={{ mr: 1, width: 32, height: 32 }}
                              >
                                {ban.user.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {ban.user.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {ban.user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{ban.reason}</TableCell>
                          <TableCell>{ban.bannedBy.username}</TableCell>
                          <TableCell>{formatDate(ban.createdAt)}</TableCell>
                          <TableCell>
                            {new Date(ban.bannedUntil).getFullYear() > 2050 
                              ? 'Permanent' 
                              : formatDate(ban.bannedUntil)
                            }
                          </TableCell>
                          <TableCell>
                            {ban.isActive ? (
                              <Chip 
                                label={t('admin.active')} 
                                color="error" 
                                size="small"
                              />
                            ) : (
                              <Chip 
                                label={t('admin.inactive')} 
                                color="default" 
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ m: 2 }}>
                  {t('admin.noBanHistory')}
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Ban User Dialog */}
      <Dialog
        open={banDialogOpen}
        onClose={handleCloseBanDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('admin.banUser')}</DialogTitle>
        <DialogContent>
          {!selectedUser ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('admin.searchUser')}
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('admin.searchUserPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearchUsers}
                  startIcon={<Search />}
                >
                  {t('common.search')}
                </Button>
              </Box>
              
              {searchResults.length > 0 ? (
                <Grid container spacing={2}>
                  {searchResults.map((user) => (
                    <Grid item xs={12} key={user.id}>
                      <Card>
                        <CardContent sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={user.profilePic} 
                              sx={{ mr: 2 }}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1">
                                {user.username}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                            
                            <Chip 
                              label={user.role} 
                              size="small" 
                              color={user.role === 'admin' ? 'error' : 'primary'}
                              sx={{ ml: 'auto' }}
                            />
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={() => handleSelectUser(user)}
                            disabled={user.role === 'admin'}
                          >
                            {t('common.select')}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : searchTerm.length > 0 && (
                <Alert severity="info">
                  {t('admin.noUsersFound')}
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  src={selectedUser.profilePic} 
                  sx={{ width: 50, height: 50, mr: 2 }}
                >
                  {selectedUser.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedUser.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
                
                <Chip 
                  label={selectedUser.role} 
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label={t('admin.banReason')}
                  value={banForm.reason}
                  onChange={handleBanFormChange('reason')}
                  multiline
                  rows={3}
                  required
                  error={banUserMutation.isError}
                  helperText={banUserMutation.error?.message}
                />
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>{t('admin.banDuration')}</InputLabel>
                <Select
                  value={banForm.banDuration}
                  onChange={handleBanFormChange('banDuration')}
                  label={t('admin.banDuration')}
                >
                  <MenuItem value="1d">{t('admin.banDuration1Day')}</MenuItem>
                  <MenuItem value="3d">{t('admin.banDuration3Days')}</MenuItem>
                  <MenuItem value="7d">{t('admin.banDuration1Week')}</MenuItem>
                  <MenuItem value="30d">{t('admin.banDuration30Days')}</MenuItem>
                  <MenuItem value="permanent">{t('admin.banDurationPermanent')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBanDialog}>
            {t('common.cancel')}
          </Button>
          {selectedUser && (
            <Button
              onClick={handleBanSubmit}
              variant="contained"
              color="error"
              disabled={!banForm.reason || banUserMutation.isLoading}
            >
              {banUserMutation.isLoading ? t('common.loading') : t('admin.banUser')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminBanManagement;