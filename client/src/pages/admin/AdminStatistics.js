import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  PeopleAlt,
  Comment,
  MenuBook,
  Star,
  TrendingUp,
  Block,
  Person,
  EmojiEvents
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { 
  getPlatformStatistics, 
  getTopReaders, 
  getTopLevelUsers 
} from '../../api/adminService';
import { motion } from 'framer-motion';

// Компонент для статистичної картки
const StatCard = ({ icon, title, value, color = 'primary', isLoading = false }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Typography variant="h4" component="div" fontWeight="bold" align="center">
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const AdminStatistics = () => {
  const { t } = useTranslation();
  
  // Запит для отримання загальної статистики
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useQuery('platformStatistics', getPlatformStatistics);
  
  // Запит для отримання топ читачів
  const { 
    data: topReadersData, 
    isLoading: topReadersLoading 
    } = useQuery('topReaders', () => getTopReaders(10), {
    retry: 3,
    retryDelay: 1000,
    staleTime: 60000, 
    refetchOnWindowFocus: false
});
  
  // Запит для отримання користувачів з найвищим рівнем
  const { 
    data: topLevelData, 
    isLoading: topLevelLoading 
  } = useQuery('topLevelUsers', () => getTopLevelUsers(10));
  
  // Анімація для компонентів
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
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('admin.statistics')}
        </Typography>
        
        {/* Загальна статистика */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          {t('admin.platformOverview')}
        </Typography>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Статистика користувачів */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }} component={motion.div} variants={itemVariants}>
              <StatCard
                icon={<PeopleAlt />}
                title={t('admin.totalUsers')}
                value={statsData?.usersStats.total || 0}
                isLoading={statsLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }} component={motion.div} variants={itemVariants}>
              <StatCard
                icon={<Comment />}
                title={t('admin.totalComments')}
                value={statsData?.contentStats.totalComments || 0}
                color="secondary"
                isLoading={statsLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }} component={motion.div} variants={itemVariants}>
              <StatCard
                icon={<MenuBook />}
                title={t('admin.completedManhwas')}
                value={statsData?.readingStats.completedManhwas || 0}
                color="success"
                isLoading={statsLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }} component={motion.div} variants={itemVariants}>
              <StatCard
                icon={<Block />}
                title={t('admin.activeBans')}
                value={statsData?.moderation.activeBans || 0}
                color="error"
                isLoading={statsLoading}
              />
            </Grid>
          </Grid>
        </motion.div>
        
        {/* Деталізована статистика */}
        <Grid container spacing={4}>
          {/* Користувачі з найвищим рівнем */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmojiEvents sx={{ mr: 1, color: 'warning.main' }} />
                  {t('admin.topLevelUsers')}
                </Box>
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {topLevelLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : topLevelData?.topLevelUsers?.length > 0 ? (
                <List>
                  {topLevelData.topLevelUsers.map((user, index) => (
                    <ListItem key={user._id} divider={index < topLevelData.topLevelUsers.length - 1}>
                      <ListItemAvatar>
                        <Avatar 
                          src={user.profilePic}
                          sx={{ 
                            bgcolor: index < 3 ? 'warning.main' : 'primary.main',
                            border: index < 3 ? '2px solid gold' : 'none'
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.username}
                        secondary={`Experience: ${user.experience}`}
                      />
                      <Tooltip title="Level">
                        <Avatar sx={{ bgcolor: 'success.main', ml: 2 }}>
                          {user.level}
                        </Avatar>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography align="center" color="text.secondary">
                  {t('admin.noData')}
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Топ читачі */}
          <Grid size={{ xs: 12, md: 6 }} >
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MenuBook sx={{ mr: 1, color: 'secondary.main' }} />
                  {t('admin.topReaders')}
                </Box>
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {topReadersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : topReadersData?.topReaders?.length > 0 ? (
                <List>
                  {topReadersData.topReaders.map((item, index) => (
                    <ListItem key={item.user.id} divider={index < topReadersData.topReaders.length - 1}>
                      <ListItemAvatar>
                        <Avatar 
                          src={item.user.profilePic}
                          sx={{ 
                            bgcolor: index < 3 ? 'secondary.main' : 'primary.main',
                            border: index < 3 ? '2px solid purple' : 'none'
                          }}
                        >
                          {item.user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.user.username}
                        secondary={`Level: ${item.user.level}`}
                      />
                      <Tooltip title="Completed Manhwas">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MenuBook sx={{ mr: 0.5, color: 'success.main' }} />
                          <Typography variant="body1" fontWeight="bold">
                            {item.completedCount}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography align="center" color="text.secondary">
                  {t('admin.noData')}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminStatistics;