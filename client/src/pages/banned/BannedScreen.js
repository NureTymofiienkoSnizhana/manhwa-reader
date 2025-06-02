import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon
} from '@mui/material';
import { BlockOutlined, WarningAmber, FiberManualRecord } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const BannedScreen = () => {
  const { t } = useTranslation();
  const { userBan, logout } = useAuth();
  const [localBan, setLocalBan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Спроба отримати інформацію про бан з localStorage, якщо вона не є в контексті
  useEffect(() => {
    try {
      const storedBan = localStorage.getItem('userBan');
      
      if (!userBan && storedBan) {
        console.log('Loading ban info from localStorage:', storedBan);
        setLocalBan(JSON.parse(storedBan));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading ban info from localStorage:', error);
      setLoading(false);
    }
  }, [userBan]);
  
  // Використовуємо або інформацію з контексту, або з localStorage
  const banInfo = userBan || localBan;
  
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // Якщо немає інформації про бан, показуємо відповідне повідомлення
  if (!banInfo) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              No ban information available
            </Typography>
            <Typography variant="body1" paragraph>
              There is no ban information associated with this account.
            </Typography>
            <Button 
              variant="contained"
              color="primary"
              onClick={() => window.location.href = '/'}
            >
              Go to Home
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }
  
  // Форматування дати закінчення бану
  const formatBanDate = (date) => {
    if (!date) return 'Permanent';
    
    try {
      return format(new Date(date), 'PPP p'); 
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };
  
  // Розрахунок часу до закінчення бану
  const getRemainingTime = () => {
    if (!banInfo.bannedUntil) return 'Permanent';
    
    const now = new Date();
    const banEnd = new Date(banInfo.bannedUntil);
    
    if (banEnd <= now) {
      return 'Your ban has expired';
    }
    
    const diffMs = banEnd - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} days and ${diffHrs} hours remaining`;
    } else {
      return `${diffHrs} hours remaining`;
    }
  };
  
  // Перевірка, чи бан постійний (більше 10 років)
  const isPermanent = () => {
    if (!banInfo.bannedUntil) return true;
    
    const banEnd = new Date(banInfo.bannedUntil);
    const now = new Date();
    const tenYearsLater = new Date();
    tenYearsLater.setFullYear(now.getFullYear() + 10);
    
    return banEnd > tenYearsLater;
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 4, borderRadius: 2, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.main' }}>
          <BlockOutlined sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          
          <Typography variant="h4" component="h1" color="error" gutterBottom fontWeight="bold">
            {t('banned.accountSuspended')}
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 3 }}>
            {isPermanent() 
              ? t('banned.accountPermanentlyBanned') 
              : t('banned.accountTemporarilyBanned')}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ textAlign: 'left', mb: 4 }}>
            <Typography variant="body1" gutterBottom>
              <strong>{t('banned.reason')}:</strong> {banInfo.reason || 'No reason provided'}
            </Typography>
            
            {!isPermanent() && (
              <>
                <Typography variant="body1" gutterBottom>
                  <strong>{t('banned.bannedUntil')}:</strong> {formatBanDate(banInfo.bannedUntil)}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>{t('banned.timeRemaining')}:</strong> {getRemainingTime()}
                </Typography>
              </>
            )}
            
            <Typography variant="body1">
              <strong>{t('banned.bannedBy')}:</strong> {
                banInfo.bannedBy?.username || 
                (typeof banInfo.bannedBy === 'string' ? banInfo.bannedBy : 'Administrator')
              }
            </Typography>
          </Box>
          
          <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningAmber sx={{ color: 'warning.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('banned.restrictions')}
              </Typography>
            </Box>
            
            {/* Замінено список <ul> на компонент List з Material-UI */}
            <List dense disablePadding>
              <ListItem sx={{ py: 0.5, pl: 0 }}>
                <ListItemIcon sx={{ minWidth: '24px' }}>
                  <FiberManualRecord sx={{ fontSize: 8 }} />
                </ListItemIcon>
                <Typography variant="body2">
                  {t('banned.cannotComment')}
                </Typography>
              </ListItem>
              
              <ListItem sx={{ py: 0.5, pl: 0 }}>
                <ListItemIcon sx={{ minWidth: '24px' }}>
                  <FiberManualRecord sx={{ fontSize: 8 }} />
                </ListItemIcon>
                <Typography variant="body2">
                  {t('banned.cannotUpload')}
                </Typography>
              </ListItem>
              
              <ListItem sx={{ py: 0.5, pl: 0 }}>
                <ListItemIcon sx={{ minWidth: '24px' }}>
                  <FiberManualRecord sx={{ fontSize: 8 }} />
                </ListItemIcon>
                <Typography variant="body2">
                  {t('banned.cannotRate')}
                </Typography>
              </ListItem>
              
              <ListItem sx={{ py: 0.5, pl: 0 }}>
                <ListItemIcon sx={{ minWidth: '24px' }}>
                  <FiberManualRecord sx={{ fontSize: 8 }} />
                </ListItemIcon>
                <Typography variant="body2">
                  {t('banned.limitedAccess')}
                </Typography>
              </ListItem>
            </List>
          </Box>
          
          <Typography variant="body2" paragraph color="text.secondary">
            {t('banned.contactSupport')}
          </Typography>
          
          <Button 
            variant="contained"
            color="primary"
            onClick={() => {
              logout();
              // Очищаємо також інформацію про бан з localStorage
              localStorage.removeItem('userBan');
            }}
            sx={{ mt: 2 }}
          >
            {t('banned.logout')}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default BannedScreen;