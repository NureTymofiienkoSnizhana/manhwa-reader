import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.mode === 'light'
          ? theme.palette.grey[200]
          : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            mb: 2,
          }}
        >
          <Box sx={{ mb: { xs: 2, sm: 0 } }}>
            <Typography variant="h6" component="div" gutterBottom>
              {t('app.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('app.slogan')}
            </Typography>
          </Box>
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3,
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <Box>
              <Typography variant="subtitle1" component="div" gutterBottom>
                Navigation
              </Typography>
              <Link href="/" color="inherit" display="block" sx={{ mb: 0.5 }}>
                {t('nav.home')}
              </Link>
              <Link href="/browse" color="inherit" display="block" sx={{ mb: 0.5 }}>
                {t('nav.browse')}
              </Link>
              <Link href="/my-library" color="inherit" display="block">
                {t('nav.myLibrary')}
              </Link>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" component="div" gutterBottom>
                Account
              </Typography>
              <Link href="/profile" color="inherit" display="block" sx={{ mb: 0.5 }}>
                {t('nav.profile')}
              </Link>
              <Link href="/settings" color="inherit" display="block" sx={{ mb: 0.5 }}>
                {t('nav.settings')}
              </Link>
            </Box>
          </Box>
        </Box>
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} {t('app.title')}. All rights reserved.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: { xs: 2, sm: 0 },
            }}
          >
            <Link href="/terms" color="inherit">
              Terms of Service
            </Link>
            <Link href="/privacy" color="inherit">
              Privacy Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;