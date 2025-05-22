import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminUsers = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Users
        </Typography>
        <Typography>
          User management content will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminUsers;