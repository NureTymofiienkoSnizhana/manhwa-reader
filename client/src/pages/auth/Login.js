import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Paper,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { login } from '../../api/authService';

const Login = () => {
  const { t } = useTranslation();
  const { loginUser, setUserBan } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  // Redirect to previous page or home after login
  const from = location.state?.from?.pathname || '/';
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.validEmail');
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setAlert({ type: '', message: '' });
    
    try {
      // Використовуємо безпосередньо функцію API, а не контекст
      const response = await login(formData);
      
      // Якщо успішний вхід, просто перенаправляємо
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      
      // Перевіряємо, чи помилка через бан
      if (error.response && error.response.status === 403 && error.response.data.ban) {
        console.log("User is banned:", error.response.data.ban);
        
        // Зберігаємо інформацію про бан та токен у локальному сховищі
        localStorage.setItem('userBan', JSON.stringify(error.response.data.ban));
        
        // Перенаправляємо на сторінку бану
        navigate('/banned');
      } else {
        // Інші помилки входу
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Login failed. Please check your credentials.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            mt: 8,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5">
            {t('auth.loginTitle')}
          </Typography>
          
          {alert.message && (
            <Alert severity={alert.type} sx={{ width: '100%', mt: 2 }}>
              {alert.message}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('auth.email')}
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.password')}
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('auth.signIn')}
            </Button>
            
            <Grid container>
              <Grid item xs>
                <Link to="/forgot-password" variant="body2">
                  {t('auth.forgotPassword')}
                </Link>
              </Grid>
              <Grid item>
                <Link to="/register" variant="body2">
                  {t('auth.noAccount')} {t('auth.signUp')}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Login;