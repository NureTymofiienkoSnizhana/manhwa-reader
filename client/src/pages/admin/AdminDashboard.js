import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminDashboard = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography>
          Admin Dashboard content will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminDashboard;