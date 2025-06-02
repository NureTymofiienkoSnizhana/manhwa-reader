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
    enabled: activeTab === 0,
    onError: (error) => {
      console.error("Error fetching active bans:", error);
    }
  });
  
  // Отримання історії банів
  const { 
    data: banHistoryData, 
    isLoading: banHistoryLoading 
  } = useQuery('banHistory', getBanHistory, {
    enabled: activeTab === 1,
    onError: (error) => {
      console.error("Error fetching ban history:", error);
    }
  });
  
  // Мутація для розбану користувача
  const unbanUserMutation = useMutation(unbanUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('activeBans');
      queryClient.invalidateQueries('banHistory');
    },
    onError: (error) => {
      console.error("Error unbanning user:", error);
    }
  });
  
  // Зміна вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Розбан користувача
  const handleUnban = (userId) => {
    if (!userId) {
      console.error("Cannot unban user: userId is undefined");
      return;
    }
    unbanUserMutation.mutate(userId);
  };
  
  // Форматування дати
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Безпечне отримання першої літери імені користувача
  const getUserInitial = (user) => {
    if (!user) return '?';
    if (!user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };
  
  // Функція для безпечного відображення імені користувача
  const getUserDisplayName = (user) => {
    if (!user) return 'Unknown user';
    return user.username || 'Unnamed user';
  };
  
  // Безпечне відображення email
  const getUserEmail = (user) => {
    if (!user) return '';
    return user.email || '';
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('admin.banManagement')}
        </Typography>
        
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
                                sx={{ mr: 1, width: 32, height: 32 }}
                              >
                                {getUserInitial(ban.user)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {getUserDisplayName(ban.user)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {getUserEmail(ban.user)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{ban.reason || '-'}</TableCell>
                          <TableCell>{ban.bannedBy ? ban.bannedBy.username : 'System'}</TableCell>
                          <TableCell>{formatDate(ban.createdAt)}</TableCell>
                          <TableCell>
                            {ban.bannedUntil && new Date(ban.bannedUntil).getFullYear() > 2050 
                              ? 'Permanent' 
                              : formatDate(ban.bannedUntil)
                            }
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('admin.unban')}>
                              <IconButton 
                                color="primary"
                                onClick={() => handleUnban(ban.user?._id)}
                                disabled={!ban.user?._id}
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
                                sx={{ mr: 1, width: 32, height: 32 }}
                              >
                                {getUserInitial(ban.user)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {getUserDisplayName(ban.user)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {getUserEmail(ban.user)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{ban.reason || '-'}</TableCell>
                          <TableCell>{ban.bannedBy ? ban.bannedBy.username : 'System'}</TableCell>
                          <TableCell>{formatDate(ban.createdAt)}</TableCell>
                          <TableCell>
                            {ban.bannedUntil && new Date(ban.bannedUntil).getFullYear() > 2050 
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
    </Container>
  );
};

export default AdminBanManagement;