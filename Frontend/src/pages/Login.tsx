import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Sheet, Typography, FormControl, FormLabel, Input, Button, Link, Box } from '@mui/joy';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
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
            Welcome back!
          </Typography>
          <Typography level="body-sm">Sign in to continue.</Typography>
        </div>

        <form onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormControl>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Box sx={{ mt: 1 }}>
              <Link component={RouterLink} to="/forgot-password" level="body-sm">
                Forgot password?
              </Link>
            </Box>
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

          <Button type="submit" fullWidth sx={{ mb: 2 }}>
            Sign In
          </Button>
        </form>

        <Typography level="body-sm" textAlign="center">
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register">
            Sign up
          </Link>
        </Typography>
      </Sheet>
    </Box>
  );
}