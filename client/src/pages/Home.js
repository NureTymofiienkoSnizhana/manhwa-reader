import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Divider,
  Tabs,
  Tab,
  Rating,
  Skeleton,
  Paper,
  Link
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { searchManhwas } from '../api/manhwaService';
import { getRecommendations } from '../api/recommendationService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import ManhwaCard from '../components/common/ManhwaCard';

const Home = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  // Fetch popular manhwas
  const { data: popularData, isLoading: popularLoading, error: popularError } = useQuery(
    'popularManhwas',
    () => searchManhwas('', 10, 0, { order: { followedCount: 'desc' } }),
    { 
      staleTime: 300000, // 5 minutes
      retry: 3,
      onError: (error) => console.error('Error fetching popular manhwas:', error)
    }
  );
  
  // Fetch latest updates
  const { data: latestData, isLoading: latestLoading } = useQuery(
    'latestManhwas',
    () => searchManhwas('', 10, 0, { order: { latestUploadedChapter: 'desc' } }),
    { staleTime: 60000 } // 1 minute
  );
  
  // Fetch recommendations if authenticated
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery(
    'recommendations',
    getRecommendations,
    { 
      enabled: isAuthenticated,
      staleTime: 600000 // 10 minutes
    }
  );
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Animation variants
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
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        sx={{
          py: 8,
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          className="gradient-text"
          sx={{ fontWeight: 700 }}
        >
          {t('app.title')}
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          {t('app.slogan')}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            component={RouterLink} 
            to="/browse" 
            variant="contained" 
            size="large" 
            color="primary"
            sx={{ mr: 2 }}
          >
            {t('nav.browse')}
          </Button>
          {!isAuthenticated && (
            <Button 
              component={RouterLink} 
              to="/register" 
              variant="outlined" 
              size="large"
            >
              {t('auth.signUp')}
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Content Tabs */}
      <Paper elevation={0} sx={{ mb: 4, bgcolor: 'background.default' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label={t('manhwa.popular')} />
          <Tab label={t('manhwa.latest')} />
          {isAuthenticated && <Tab label={t('manhwa.recommended')} />}
        </Tabs>
      </Paper>
      
      {/* Tab Content */}
      <Box sx={{ mt: 4, mb: 8 }}>
        {/* Popular Manhwas */}
        {activeTab === 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
          <Grid container spacing={3}>
            {popularLoading
              ? Array.from(new Array(6)).map((_, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Card>
                      <Skeleton variant="rectangular" height={250} />
                      <CardContent>
                        <Skeleton variant="text" />
                        <Skeleton variant="text" width="60%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : popularData?.manga?.map((manhwa) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.id} component={motion.div} variants={itemVariants}>
                    <ManhwaCard manhwa={manhwa} />
                  </Grid>
                ))}
          </Grid>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                component={RouterLink}
                to="/browse"
              >
                {t('common.viewMore')}
              </Button>
            </Box>
          </motion.div>
        )}
        
        {/* Latest Updates */}
        {activeTab === 1 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3}>
              {latestLoading
                ? Array.from(new Array(6)).map((_, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                      <Card>
                        <Skeleton variant="rectangular" height={250} />
                        <CardContent>
                          <Skeleton variant="text" />
                          <Skeleton variant="text" width="60%" />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                : latestData?.manga?.map((manhwa) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.id} component={motion.div} variants={itemVariants}>
                      <ManhwaCard 
                        manhwa={manhwa} 
                        showNewBadge={true} 
                        showReadButton={true} 
                        imageHeight={300}
                        showCompletedBadge={manhwa.status === 'completed'}
                      />
                    </Grid>
                  ))}
            </Grid>
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                component={RouterLink}
                to="/browse"
              >
                {t('common.viewMore')}
              </Button>
            </Box>
          </motion.div>
        )}
        
        {/* Recommended Manhwas (Only for authenticated users) */}
        {activeTab === 2 && isAuthenticated && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {recommendationsLoading ? (
              <Grid container spacing={3}>
                {Array.from(new Array(3)).map((_, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Card sx={{ display: 'flex', height: '200px' }}>
                      <Skeleton variant="rectangular" width={140} height={200} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <CardContent>
                          <Skeleton variant="text" height={40} />
                          <Skeleton variant="text" />
                          <Skeleton variant="text" />
                          <Skeleton variant="text" width="60%" />
                        </CardContent>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : recommendationsData?.recommendations?.length > 0 ? (
            <Grid container spacing={3}>
              {recommendationsData.recommendations.map((rec, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} component={motion.div} variants={itemVariants}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={rec.coverImage || '/placeholder-cover.jpg'}
                        alt={rec.title}
                        sx={{ height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom noWrap>
                        {rec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1
                      }}>
                        {rec.description}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {rec.reason}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {rec.id ? (
                        <Button 
                          size="small" 
                          component={RouterLink}
                          to={`/manhwa/${rec.id}`}
                          variant="outlined"
                        >
                          {t('common.view')}
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          component={RouterLink}
                          to={`/search?q=${encodeURIComponent(rec.title)}`}
                          variant="outlined"
                        >
                          {t('common.search')}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">
                  {t('library.noManhwas')}
                </Typography>
                <Button 
                  variant="contained" 
                  component={RouterLink}
                  to="/browse"
                  sx={{ mt: 2 }}
                >
                  {t('library.addSome')}
                </Button>
              </Box>
            )}
          </motion.div>
        )}
      </Box>
    </Container>
  );
};

export default Home;