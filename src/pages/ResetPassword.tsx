import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sheet, Typography, FormControl, FormLabel, Input, Button, Box } from '@mui/joy';
import axios from 'axios';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset token');
        return;
      }

      try {
        await axios.get(`/api/auth/verify-reset-token?token=${token}`);
        setIsValidToken(true);
      } catch (err) {
        setError('Invalid or expired reset token');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await axios.post('/api/auth/reset-password', {
        token,
        password
      });
      setMessage('Password has been reset successfully');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isValidToken) {
    return (
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.body'
        }}
      >
        <Typography level="h4" color="danger">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.body'
      }}
    >
      <Sheet
        sx={{
          width: 400,
          py: 3,
          px: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderRadius: 'sm',
          boxShadow: 'md',
        }}
        variant="outlined"
      >
        <div>
          <Typography level="h4" component="h1">
            Reset Password
          </Typography>
          <Typography level="body-sm">
            Please enter your new password.
          </Typography>
        </div>

        <form onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>New Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </FormControl>

          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </FormControl>

          {error && (
            <Typography
              level="body-sm"
              color="danger"
              sx={{ mb: 2 }}
            >
              {error}
            </Typography>
          )}

          {message && (
            <Typography
              level="body-sm"
              color="success"
              sx={{ mb: 2 }}
            >
              {message}
            </Typography>
          )}

          <Button 
            type="submit" 
            fullWidth
            loading={isSubmitting}
          >
            Reset Password
          </Button>
        </form>
      </Sheet>
    </Box>
  );
}