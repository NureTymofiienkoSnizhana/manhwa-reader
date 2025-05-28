import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Tooltip,
  Pagination,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  RefreshRounded as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getUsers, 
  searchUsers, 
  updateUserRole, 
  deleteUser 
} from '../../api/adminService';
import { format } from 'date-fns';

const AdminUsers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  
  // Queries & Mutations
  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch
  } = useQuery(
    ['adminUsers', page, limit, filterRole],
    () => getUsers({ page, limit, role: filterRole !== 'all' ? filterRole : undefined }),
    { keepPreviousData: true }
  );
  
  const { 
    data: searchData, 
    isLoading: searchLoading,
    refetch: refetchSearch
  } = useQuery(
    ['searchUsers', searchTerm],
    () => searchUsers(searchTerm),
    { 
      enabled: searchTerm.length >= 3,
      keepPreviousData: true
    }
  );
  
  const updateRoleMutation = useMutation(
    (data) => updateUserRole(data.userId, data.role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        setEditDialogOpen(false);
      }
    }
  );
  
  const deleteUserMutation = useMutation(
    (userId) => deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        setDeleteDialogOpen(false);
      }
    }
  );
  
  // Computed
  const users = searchTerm.length >= 3 ? (searchData?.users || []) : (usersData?.users || []);
  const totalPages = usersData?.pagination?.pages || 1;
  
  // Effects
  useEffect(() => {
    // Reset page when filter changes
    setPage(1);
  }, [filterRole]);
  
  // Handlers
  const handleSearch = () => {
    if (searchTerm.length >= 3) {
      refetchSearch();
    } else if (searchTerm.length === 0) {
      refetch();
    }
  };
  
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditDialogOpen(true);
  };
  
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const handleUpdateRole = () => {
    if (!selectedUser || !newRole) return;
    
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole
    });
  };
  
  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };
  
  const handleBanUser = (user) => {
    // Navigate to ban management page with user pre-selected
    window.location.href = `/admin/bans?userId=${user.id}`;
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'translator': return 'secondary';
      case 'reader': return 'primary';
      default: return 'default';
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('admin.manageUsers')}
        </Typography>
        
        {/* Search and filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder={t('admin.searchUsers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('admin.filterByRole')}</InputLabel>
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  label={t('admin.filterByRole')}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">{t('common.all')}</MenuItem>
                  <MenuItem value="reader">{t('admin.reader')}</MenuItem>
                  <MenuItem value="translator">{t('admin.translator')}</MenuItem>
                  <MenuItem value="admin">{t('admin.admin')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refetch}
                fullWidth
              >
                {t('common.refresh')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Users table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message || t('common.error')}
          </Alert>
        ) : users.length > 0 ? (
          <>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('auth.username')}</TableCell>
                    <TableCell>{t('auth.email')}</TableCell>
                    <TableCell>{t('admin.role')}</TableCell>
                    <TableCell>{t('profile.memberSince')}</TableCell>
                    <TableCell>{t('profile.level')}</TableCell>
                    <TableCell>{t('admin.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={user.profilePic} 
                            alt={user.username}
                            sx={{ mr: 2, bgcolor: 'primary.main' }}
                          >
                            {user.username?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body1">
                            {user.username}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={t(`admin.${user.role}`)} 
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.level} 
                          size="small" 
                          color="default"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title={t('admin.editRole')}>
                            <IconButton 
                              onClick={() => handleEditUser(user)}
                              disabled={user.role === 'admin' && user.id !== selectedUser?.id}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={t('admin.banUser')}>
                            <IconButton 
                              onClick={() => handleBanUser(user)}
                              disabled={user.role === 'admin'}
                              color="error"
                            >
                              <BlockIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={t('admin.deleteUser')}>
                            <IconButton 
                              onClick={() => handleDeleteUser(user)}
                              disabled={user.role === 'admin'}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {!searchTerm && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Alert severity="info">
            {searchTerm ? t('admin.noUsersFound') : t('admin.noUsers')}
          </Alert>
        )}
      </Box>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>{t('admin.editUser')}</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  src={selectedUser.profilePic} 
                  alt={selectedUser.username}
                  sx={{ width: 50, height: 50, mr: 2 }}
                >
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>{t('admin.role')}</InputLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  label={t('admin.role')}
                >
                  <MenuItem value="reader">{t('admin.reader')}</MenuItem>
                  <MenuItem value="translator">{t('admin.translator')}</MenuItem>
                  <MenuItem value="admin">{t('admin.admin')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateRole}
            disabled={updateRoleMutation.isLoading}
          >
            {updateRoleMutation.isLoading ? t('common.loading') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('admin.deleteUser')}</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body1" paragraph>
                {t('admin.deleteUserConfirm', {
                  username: selectedUser.username
                })}
              </Typography>
              <Typography variant="body2" color="error">
                {t('admin.deleteUserWarning')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteUserMutation.isLoading}
          >
            {deleteUserMutation.isLoading ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsers;