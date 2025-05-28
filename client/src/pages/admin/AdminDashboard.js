import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Block as BlockIcon,
  BarChart as BarChartIcon,
  EmojiEvents as EmojiEventsIcon,
  Flag as FlagIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getPlatformStatistics } from '../../api/adminService';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { data: statsData, isLoading } = useQuery('dashboardStats', getPlatformStatistics);
  
  // Адміністративні модулі
  const adminModules = [
    {
      title: t('admin.userManagement'),
      description: t('admin.userManagementDesc'),
      icon: <PeopleIcon fontSize="large" color="primary" />,
      link: '/admin/users'
    },
    {
      title: t('admin.banManagement'),
      description: t('admin.banManagementDesc'),
      icon: <BlockIcon fontSize="large" color="error" />,
      link: '/admin/bans'
    },
    {
      title: t('admin.statistics'),
      description: t('admin.statisticsDesc'),
      icon: <BarChartIcon fontSize="large" color="info" />,
      link: '/admin/statistics'
    },
    {
      title: t('admin.levelTasks'),
      description: t('admin.levelTasksDesc'),
      icon: <EmojiEventsIcon fontSize="large" color="warning" />,
      link: '/admin/level-tasks'
    }
  ];
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('admin.dashboard')}
        </Typography>
        
        {/* Статистика платформи */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('admin.quickStats')}
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" fontWeight="bold">
                  {isLoading ? '...' : statsData?.usersStats.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.totalUsers')}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <MenuBookIcon color="secondary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" fontWeight="bold">
                  {isLoading ? '...' : statsData?.readingStats.completedManhwas || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.completedManhwas')}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <FlagIcon color="info" sx={{ fontSize: 40 }} />
                <Typography variant="h5" fontWeight="bold">
                  {isLoading ? '...' : statsData?.contentStats.totalComments || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.totalComments')}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <BlockIcon color="error" sx={{ fontSize: 40 }} />
                <Typography variant="h5" fontWeight="bold">
                  {isLoading ? '...' : statsData?.moderation.activeBans || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.activeBans')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              component={RouterLink} 
              to="/admin/statistics" 
              color="primary"
            >
              {t('common.viewMore')}
            </Button>
          </Box>
        </Paper>
        
        {/* Адміністративні модулі */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
          {t('admin.adminModules')}
        </Typography>
        
        <Grid container spacing={3}>
          {adminModules.map((module, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    {module.icon}
                  </Box>
                  <Typography variant="h6" component="h2" align="center" gutterBottom>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {module.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    component={RouterLink} 
                    to={module.link}
                    variant="contained"
                    size="small"
                  >
                    {t('common.manage')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;