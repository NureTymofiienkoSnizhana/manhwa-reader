// src/components/common/ManhwaCard.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Rating,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const ManhwaCard = ({ 
  manhwa, 
  showNewBadge = false,
  showReadButton = false,
  imageHeight = 250,
  showCompletedBadge = false
}) => {
  const { t } = useTranslation();

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 8
        },
        borderRadius: 2,
        overflow: 'hidden',
        maxWidth: '100%'
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          image={manhwa.coverImage || '/placeholder-cover.jpg'}
          alt={manhwa.title}
          height={imageHeight}
          sx={{ 
            objectFit: 'cover',
            objectPosition: 'center top'
          }}
          loading="lazy"
        />
        
        {showNewBadge && (
          <Chip
            label="NEW"
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontWeight: 'bold',
              fontSize: '0.7rem'
            }}
          />
        )}
        
        {showCompletedBadge && (
          <Chip
            label="Completed"
            color="success"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              fontSize: '0.7rem'
            }}
          />
        )}
        
        {manhwa.status && !showCompletedBadge && (
          <Chip
            label={manhwa.status}
            color="primary"
            size="small"
            variant="outlined"
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              fontSize: '0.7rem',
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white'
            }}
          />
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography 
          gutterBottom 
          variant="h6" 
          component="div" 
          noWrap
          sx={{ fontWeight: 600, fontSize: '1rem' }}
        >
          {manhwa.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={manhwa.rating || 0} readOnly size="small" precision={0.5} />
          {manhwa.rating > 0 && (
            <Typography variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
              ({manhwa.rating})
            </Typography>
          )}
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 0.5,
            minHeight: '2.5em'
          }}
        >
          {manhwa.description || 'No description available.'}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
        <Button 
          size="small" 
          component={RouterLink}
          to={`/manhwa/${manhwa.id}`}
          variant="outlined"
          color="primary"
          sx={{ mr: 1 }}
        >
          {t('common.view')}
        </Button>
        
        {showReadButton && (
          <Button 
            size="small" 
            component={RouterLink}
            to={`/read/${manhwa.id}`}
            color="secondary"
            variant="contained"
          >
            {t('manhwa.readNow')}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ManhwaCard;