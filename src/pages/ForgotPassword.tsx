import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Sheet, Typography, FormControl, FormLabel, Input, Button, Link, Box } from '@mui/joy';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await axios.post('/api/auth/forgot-password', { email });
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      setError('Failed to process password reset request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Forgot Password
          </Typography>
          <Typography level="body-sm">
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>
        </div>

        <form onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            sx={{ mb: 2 }}
            loading={isSubmitting}
          >
            Reset Password
          </Button>
        </form>

        <Typography level="body-sm" textAlign="center">
          Remember your password?{' '}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </Sheet>
    </Box>
  );
}