import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminLevelTasks = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Level Tasks
        </Typography>
        <Typography>
          Level tasks management content will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminLevelTasks;