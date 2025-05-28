import React from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button,
  Divider
} from '@mui/material';
import { BlockOutlined, WarningAmber } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const BannedScreen = () => {
  const { t } = useTranslation();
  const { userBan, logout } = useAuth();
  
  if (!userBan) {
    return null;
  }
  
  // Форматування дати закінчення бану
  const formatBanDate = (date) => {
    try {
      return format(new Date(date), 'PPP p'); 
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Розрахунок часу до закінчення бану
  const getRemainingTime = () => {
    const now = new Date();
    const banEnd = new Date(userBan.bannedUntil);
    
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
    const banEnd = new Date(userBan.bannedUntil);
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
              <strong>{t('banned.reason')}:</strong> {userBan.reason}
            </Typography>
            
            {!isPermanent() && (
              <>
                <Typography variant="body1" gutterBottom>
                  <strong>{t('banned.bannedUntil')}:</strong> {formatBanDate(userBan.bannedUntil)}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>{t('banned.timeRemaining')}:</strong> {getRemainingTime()}
                </Typography>
              </>
            )}
            
            <Typography variant="body1">
              <strong>{t('banned.bannedBy')}:</strong> {userBan.bannedBy?.username || 'Administrator'}
            </Typography>
          </Box>
          
          <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningAmber sx={{ color: 'warning.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('banned.restrictions')}
              </Typography>
            </Box>
            
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>{t('banned.cannotComment')}</li>
              <li>{t('banned.cannotUpload')}</li>
              <li>{t('banned.cannotRate')}</li>
              <li>{t('banned.limitedAccess')}</li>
            </Typography>
          </Box>
          
          <Typography variant="body2" paragraph color="text.secondary">
            {t('banned.contactSupport')}
          </Typography>
          
          <Button 
            variant="contained"
            color="primary"
            onClick={logout}
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