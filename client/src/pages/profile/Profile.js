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
  Button,
  CardMedia,
  CardActions,
  Skeleton
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getUserProfile, getUserReadingHistory } from '../../api/userService';
import { getManhwaDetails } from '../../api/manhwaService';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  CalendarToday as CalendarIcon,
  MenuBook as BookIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  // Вибираємо локаль для дат
  const dateLocale = i18n.language === 'ua' ? uk : enUS;
  
  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'userProfile',
    () => getUserProfile(),
    { staleTime: 300000 } // 5 minutes
  );
  
  // Fetch recent reading history with more details
  const { data: historyData, isLoading: historyLoading } = useQuery(
    'recentReadingDetailed',
    async () => {
      try {
        const history = await getUserReadingHistory(1, 6);
        
        // Збагачуємо дані про манхви деталями
        const enrichedManhwas = await Promise.all(
          history.manhwas.map(async (manhwa) => {
            try {
              // Спробуємо отримати детальну інформацію
              const details = await getManhwaDetails(manhwa.manhwaId);
              return {
                ...manhwa,
                description: details.manga?.description || 'No description available.',
                author: details.manga?.author || 'Unknown author',
                tags: details.manga?.tags || [],
                status: details.manga?.status || 'Unknown'
              };
            } catch (error) {
              // Якщо не вдалося отримати деталі, повертаємо базову інформацію
              return {
                ...manhwa,
                description: 'Description not available.',
                author: 'Unknown author',
                tags: [],
                status: 'Unknown'
              };
            }
          })
        );
        
        return {
          ...history,
          manhwas: enrichedManhwas
        };
      } catch (error) {
        console.error('Error fetching detailed reading history:', error);
        return { manhwas: [] };
      }
    },
    { 
      staleTime: 60000, // 1 minute
      enabled: !!user // Тільки якщо користувач авторизований
    }
  );
  
  // Calculate level progress percentage
  const calculateProgress = (experience, nextLevelExp) => {
    if (!nextLevelExp) return 0;
    return Math.min(100, Math.round((experience / nextLevelExp) * 100));
  };
  
  const progress = profileData?.user ? 
    calculateProgress(profileData.user.experience, profileData.user.nextLevelExp) : 0;
  
  // Форматування дати реєстрації
  const formatMemberSince = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Unknown date';
    }
  };
    
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
            <Grid size={{ xs:412, md: 4 }}>
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
                    <ListItemIcon>
                      <BookIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('profile.totalRead')} 
                      secondary={profileData.stats.totalManhwa} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon>
                      <StarIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('profile.totalRated')}
                      secondary={profileData.stats.totalReviews} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon>
                      <TrendingIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('profile.averageRating')}
                      secondary={profileData.stats.averageRating?.toFixed(1) || 0} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon>
                      <CalendarIcon color="info" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('profile.memberSince')}
                      secondary={formatMemberSince(profileData.user.createdAt)} 
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
                                    {t(`tasks.${req.type}`) || req.type}
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
                    component={RouterLink}
                    to="/my-library"
                  >
                    {t('common.viewAll')}
                  </Button>
                </Box>
                
                {historyLoading ? (
                  <Grid container spacing={3}>
                    {Array.from(new Array(3)).map((_, index) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Card>
                          <Skeleton variant="rectangular" height={160} />
                          <CardContent>
                            <Skeleton variant="text" />
                            <Skeleton variant="text" width="60%" />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : historyData?.manhwas?.length > 0 ? (
                  <Grid container spacing={3}>
                    {historyData.manhwas.slice(0, 3).map((manhwa) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.manhwaId}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            }
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={manhwa.coverImage || '/placeholder-cover.jpg'}
                            alt={manhwa.title}
                            height={160}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography 
                              variant="h6" 
                              component="div" 
                              noWrap
                              sx={{ fontWeight: 600, mb: 1 }}
                            >
                              {manhwa.title}
                            </Typography>
                            
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mb: 1,
                                minHeight: '2.5em'
                              }}
                            >
                              {manhwa.description}
                            </Typography>
                            
                            {manhwa.author && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {t('manhwa.author')}: {manhwa.author}
                              </Typography>
                            )}
                            
                            {manhwa.rating > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <StarIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                                <Typography variant="caption">
                                  {manhwa.rating}/5
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                          
                          <CardActions>
                            <Button 
                              size="small"
                              component={RouterLink}
                              to={`/manhwa/${manhwa.manhwaId}`}
                            >
                              {t('common.view')}
                            </Button>
                            {manhwa.lastChapterRead > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                {t('manhwa.chapterNumber', { number: manhwa.lastChapterRead })}
                              </Typography>
                            )}
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <BookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {t('profile.noRecentlyRead')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Почніть читати манхви, щоб вони з'явилися тут!
                    </Typography>
                    <Button 
                      variant="contained" 
                      component={RouterLink}
                      to="/browse"
                    >
                      {t('nav.browse')}
                    </Button>
                  </Box>
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