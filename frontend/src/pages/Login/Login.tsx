import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Fade,
  Paper,
} from '@mui/material';
import {
  Email as EmailIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { RootState, AppDispatch } from '../../store/store';
import { sendOTP, verifyOTP, resetError, resetOtpSent } from '../../store/slices/authSlice';

const validationSchemaEmail = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
});

const validationSchemaOTP = yup.object({
  otp: yup
    .string()
    .matches(/^[A-Za-z0-9]{5}$/i, 'OTP must be 5 letters or digits')
    .required('OTP is required'),
});

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, otpSent, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (otpSent) {
      setShowOTP(true);
      setCountdown(60);
    }
  }, [otpSent]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const emailForm = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: validationSchemaEmail,
    onSubmit: async (values) => {
      setEmail(values.email);
      await dispatch(sendOTP(values.email));
    },
  });

  const otpForm = useFormik({
    initialValues: {
      otp: '',
    },
    validationSchema: validationSchemaOTP,
    onSubmit: async (values) => {
      await dispatch(verifyOTP({ email, otp: values.otp }));
    },
  });

  const handleResendOTP = async () => {
    if (countdown === 0) {
      await dispatch(sendOTP(email));
      setCountdown(60);
    }
  };

  const handleBack = () => {
    setShowOTP(false);
    dispatch(resetOtpSent());
    dispatch(resetError());
    otpForm.resetForm();
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #FF69B4 30%, #4A90E2 90%)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  PROgress Tracker
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Breast Cancer Patient Survey Analytics Platform
                </Typography>
              </Box>

              {error && (
                <Fade in>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                </Fade>
              )}

              {!showOTP ? (
                <Box component="form" onSubmit={emailForm.handleSubmit}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    value={emailForm.values.email}
                    onChange={emailForm.handleChange}
                    error={emailForm.touched.email && Boolean(emailForm.errors.email)}
                    helperText={emailForm.touched.email && emailForm.errors.email}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(45deg, #FF69B4 30%, #FF1493 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FF1493 30%, #FF69B4 90%)',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={otpForm.handleSubmit}>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    OTP has been sent to {email}
                  </Alert>

                  <TextField
                    fullWidth
                    id="otp"
                    name="otp"
                    label="Enter OTP"
                    type="text"
                    value={otpForm.values.otp}
                    onChange={(e) => otpForm.setFieldValue('otp', e.target.value.toUpperCase())}
                    error={otpForm.touched.otp && Boolean(otpForm.errors.otp)}
                    helperText={otpForm.touched.otp && otpForm.errors.otp}
                    disabled={loading}
                    inputProps={{ maxLength: 5, inputMode: 'text', pattern: '[A-Za-z0-9]+' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOpenIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Button
                      variant="text"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      Change Email
                    </Button>
                    <Button
                      variant="text"
                      onClick={handleResendOTP}
                      disabled={loading || countdown > 0}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </Button>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(45deg, #FF69B4 30%, #FF1493 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FF1493 30%, #FF69B4 90%)',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>
                </Box>
              )}

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  By logging in, you agree to our Terms of Service and Privacy Policy
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: 'background.default',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Need help? Contact support@progresstracker.ca
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Login;
