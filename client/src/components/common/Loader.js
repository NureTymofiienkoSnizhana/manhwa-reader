import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Loader = ({ message }) => {
  const { t } = useTranslation();
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
      padding={4}
    >
      <CircularProgress size={50} color="primary" />
      <Typography variant="body1" sx={{ mt: 2 }}>
        {message || t('common.loading')}
      </Typography>
    </Box>
  );
};

export default Loader;