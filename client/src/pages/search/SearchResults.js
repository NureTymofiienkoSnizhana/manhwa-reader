import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useLocation } from 'react-router-dom'; // Add this import

const SearchResults = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';
  
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Results
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Showing results for: {query}
        </Typography>
        <Typography>
          Search results will be displayed here.
        </Typography>
      </Box>
    </Container>
  );
};

export default SearchResults;