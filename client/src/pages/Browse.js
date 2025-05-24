// src/pages/Browse.js
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import { searchManhwas } from '../api/manhwaService';
import ManhwaCard from '../components/common/ManhwaCard';

const Browse = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Перевірка, чи користувач має роль перекладача або адміністратора
  const isTranslatorOrAdmin = isAuthenticated && user && (user.role === 'translator' || user.role === 'admin');
  
  // Запит на пошук манги
  const { data, isLoading, error } = useQuery(
    ['searchManhwas', searchQuery],
    () => searchManhwas(searchQuery || '', 20, 0),
    { 
      enabled: activeTab === 0,
      staleTime: 60000 // 1 хвилина
    }
  );
  
  // Запит на отримання останніх оновлень
  const { data: latestData, isLoading: latestLoading } = useQuery(
    'latestManhwas',
    () => searchManhwas('', 20, 0, { order: { latestUploadedChapter: 'desc' } }),
    { 
      enabled: activeTab === 1,
      staleTime: 60000 // 1 хвилина
    }
  );
  
  // Запит на отримання популярних манг
  const { data: popularData, isLoading: popularLoading } = useQuery(
    'popularManhwas',
    () => searchManhwas('', 20, 0, { order: { followedCount: 'desc' } }),
    { 
      enabled: activeTab === 2,
      staleTime: 300000 // 5 хвилин
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // Тут можна додати додаткову логіку для пошуку
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('nav.browse')}
          </Typography>
          
          {/* Кнопка для перекладачів та адміністраторів */}
          {isTranslatorOrAdmin && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<UploadIcon />}
              component={RouterLink}
              to="/upload/new"
            >
              {t('upload.newManhwa') || "Create New Manhwa"}
            </Button>
          )}
        </Box>

        {/* Пошуковий блок */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box component="form" onSubmit={handleSearchSubmit}>
            <TextField
              fullWidth
              placeholder={t('nav.search')}
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit">
                      <FilterIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['Action', 'Romance', 'Fantasy', 'Comedy', 'Drama'].map((genre) => (
                <Chip key={genre} label={genre} clickable />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Вкладки */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="browse tabs">
            <Tab label={t('common.search')} />
            <Tab label={t('manhwa.latest')} />
            <Tab label={t('manhwa.popular')} />
          </Tabs>
        </Box>

        {/* Результати пошуку */}
        <Box>
          {/* Вміст першої вкладки - Пошук */}
          {activeTab === 0 && (
            <>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography color="error">{t('common.error')}</Typography>
                </Box>
              ) : data?.manga?.length > 0 ? (
                <Grid container spacing={3}>
                  {data.manga.map((manhwa) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.id}>
                      <ManhwaCard manhwa={manhwa} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography>{searchQuery ? t('common.noResults') : t('common.startTyping')}</Typography>
                </Box>
              )}
            </>
          )}

          {/* Вміст другої вкладки - Останні оновлення */}
          {activeTab === 1 && (
            <>
              {latestLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : latestData?.manga?.length > 0 ? (
                <Grid container spacing={3}>
                  {latestData.manga.map((manhwa) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.id}>
                      <ManhwaCard manhwa={manhwa} showNewBadge={true} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography>{t('common.noResults')}</Typography>
                </Box>
              )}
            </>
          )}

          {/* Вміст третьої вкладки - Популярні */}
          {activeTab === 2 && (
            <>
              {popularLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : popularData?.manga?.length > 0 ? (
                <Grid container spacing={3}>
                  {popularData.manga.map((manhwa) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={manhwa.id}>
                      <ManhwaCard manhwa={manhwa} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography>{t('common.noResults')}</Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Browse;