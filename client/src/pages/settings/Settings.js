import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Settings = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography>
          Settings content will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings;