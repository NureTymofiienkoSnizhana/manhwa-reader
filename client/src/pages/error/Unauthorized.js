import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <Container>
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          403
        </Typography>
        <Typography variant="h4" gutterBottom>
          Unauthorized
        </Typography>
        <Typography variant="body1" paragraph>
          You do not have permission to access this page.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/">
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default Unauthorized;