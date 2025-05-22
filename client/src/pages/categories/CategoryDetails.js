import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';

const CategoryDetails = () => {
  const { categoryId } = useParams();
  
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Category Details
        </Typography>
        <Typography>
          Details for category ID: {categoryId || 'unknown'}
        </Typography>
      </Box>
    </Container>
  );
};

export default CategoryDetails;