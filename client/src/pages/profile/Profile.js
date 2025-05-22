import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Paper,
  Grid,
  Avatar,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getUserProfile, getUserReadingHistory } from '../../api/userService';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import ManhwaCard from '../../components/common/ManhwaCard';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'userProfile',
    () => getUserProfile(),
    { staleTime: 300000 } // 5 minutes
  );
  
  // Fetch recent reading history
  const { data: historyData, isLoading: historyLoading } = useQuery(
    'recentReading',
    () => getUserReadingHistory(1, 3),
    { staleTime: 60000 } // 1 minute
  );
  
  // Calculate level progress percentage
  const calculateProgress = (experience, nextLevelExp) => {
    if (!nextLevelExp) return 0;
    return Math.min(100, Math.round((experience / nextLevelExp) * 100));
  };
  
  const progress = profileData?.user ? 
    calculateProgress(profileData.user.experience, profileData.user.nextLevelExp) : 0;
    
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          className="gradient-text"
          sx={{ fontWeight: 700, mb: 3 }}
        >
          {t('profile.myProfile')}
        </Typography>
        
        {profileLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>{t('common.loading')}</Typography>
          </Box>
        ) : profileData ? (
          <Grid container spacing={4}>
            {/* User Info Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper 
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                elevation={2} 
                sx={{ p: 3, borderRadius: 2 }}
              >
                {/* Profile header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'primary.main',
                      fontSize: '2rem'
                    }}
                  >
                    {profileData.user.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h5" component="div">
                      {profileData.user.username}
                    </Typography>
                    <Typography color="text.secondary">
                      {t(`admin.${profileData.user.role}`)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Level information */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('profile.level')} {profileData.user.level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profileData.user.experience} / {profileData.user.nextLevelExp} XP
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 5,
                      mb: 1,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                      }
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary">
                    {progress}% {t('profile.toNextLevel')}
                  </Typography>
                </Box>
                
                {/* User stats */}
                <Typography variant="h6" gutterBottom>
                  {t('profile.stats')}
                </Typography>
                <List disablePadding>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary={t('profile.totalRead')} 
                      secondary={profileData.stats.totalManhwa} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary={t('profile.totalRated')}
                      secondary={profileData.stats.totalReviews} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary={t('profile.averageRating')}
                      secondary={profileData.stats.averageRating?.toFixed(1) || 0} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary={t('profile.memberSince')}
                      secondary={
                        new Date(profileData.user.createdAt).toLocaleDateString()
                      } 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            {/* Current Level Task */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper 
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                elevation={2} 
                sx={{ p: 3, mb: 4, borderRadius: 2 }}
              >
                <Typography variant="h6" gutterBottom>
                  {t('profile.currentTask')}
                </Typography>
                
                {profileData.levelTask ? (
                  <>
                    <Typography variant="body1" paragraph>
                      {profileData.levelTask.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('profile.taskProgress')}:
                      </Typography>
                      <Grid container spacing={2}>
                        {profileData.levelTask.requirements.map((req, index) => {
                          const progressData = profileData.levelTask.progress[req.type];
                          const reqProgress = progressData ? 
                            Math.min(100, Math.round((progressData.current / req.count) * 100)) : 0;
                            
                          return (
                            <Grid size={{ xs: 12, sm: 6 }} key={index}>
                              <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2">
                                    {t(`tasks.${req.type}`)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {progressData?.current || 0} / {req.count}
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={reqProgress} 
                                  sx={{ height: 6, borderRadius: 3 }} 
                                />
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={`${t('profile.taskReward')}: +${profileData.levelTask.reward} XP`}
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  </>
                ) : (
                  <Typography>
                    {t('profile.noTasks')}
                  </Typography>
                )}
              </Paper>
              
              {/* Recent Reading */}
              <Paper 
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                elevation={2} 
                sx={{ p: 3, borderRadius: 2 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {t('profile.recentlyRead')}
                  </Typography>
                  <Button 
                    variant="text"
                    size="small"
                    component="a"
                    href="/my-library"
                  >
                    {t('common.viewAll')}
                  </Button>
                </Box>
                
                {historyLoading ? (
                  <Typography>{t('common.loading')}</Typography>
                ) : historyData?.manhwas?.length > 0 ? (
                  <Grid container spacing={3}>
                    {historyData.manhwas.map((manhwa) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.manhwaId}>
                        <ManhwaCard 
                          manhwa={{
                            id: manhwa.manhwaId,
                            title: manhwa.title,
                            coverImage: manhwa.coverImage,
                            description: '',
                            rating: manhwa.rating || 0
                          }}
                          showReadButton
                          imageHeight={200}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography>
                    {t('profile.noRecentlyRead')}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>{t('common.error')}</Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Profile;