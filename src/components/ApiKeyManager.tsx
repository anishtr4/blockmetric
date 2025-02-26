import React, { useState, useEffect } from 'react';
import { Box, Button, Input, Typography, Sheet, IconButton } from '@mui/joy';
import { getApiKeys, createApiKey, deleteApiKey } from '../services/apiKeyService';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const ApiKeyManager = () => {
  interface ApiKey {
    _id: string;
    key: string;
    name: string;
    allowedOrigins: string[];
    createdAt: string;
  }

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const data = await getApiKeys();
      setApiKeys(data);
    } catch (err) {
      setError('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const [name, setName] = useState('');
  const [newAllowedOrigins, setNewAllowedOrigins] = useState('');

  const generateApiKey = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      const origins = newAllowedOrigins
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
      const data = await createApiKey(name, origins);
      setApiKeys([...apiKeys, data]);
      setName('');
      setNewAllowedOrigins('');
    } catch (err) {
      setError('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const removeApiKey = async (key: string) => {
    if (!key || typeof key !== 'string') {
      setError('Invalid API key');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteApiKey(key);
      const updatedKeys = apiKeys.filter(apiKey => apiKey.key !== key);
      setApiKeys(updatedKeys);
    } catch (err: any) {
      console.error('Error deleting API key:', err);
      setError(err.response?.data?.message || 'Failed to delete API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography level="h2" sx={{ mb: 2, color: 'primary.600', fontSize: '1.5rem' }}>API Key Management</Typography>
      
      {error && (
        <Typography color="danger" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Sheet 
        variant="outlined"
        sx={{ 
          p: 2,
          mb: 3,
          borderRadius: 'md',
          boxShadow: 'sm',
          bgcolor: 'background.surface'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="API Key Name"
            disabled={loading}
            size="sm"
            sx={{ flex: 1 }}
          />
          <Input
            value={newAllowedOrigins}
            onChange={(e) => setNewAllowedOrigins(e.target.value)}
            placeholder="Allowed origins (comma-separated)"
            disabled={loading}
            size="sm"
            sx={{ flex: 2 }}
          />
          <Button 
            onClick={generateApiKey} 
            disabled={loading}
            loading={loading}
            size="sm"
            sx={{ 
              bgcolor: 'primary.500',
              '&:hover': { bgcolor: 'primary.600' }
            }}
          >
            Generate Key
          </Button>
        </Box>
      </Sheet>

      {loading && (
        <Typography level="body-sm" sx={{ textAlign: 'center', color: 'neutral.500' }}>
          Loading...
        </Typography>
      )}

      <Box sx={{ mt: 3 }}>
        {apiKeys.map(key => (
          <Sheet
            key={key._id}
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 'md',
              boxShadow: 'sm',
              bgcolor: 'background.surface'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography level="title-md" sx={{ color: 'primary.600' }}>{key.name}</Typography>
              <Button
                color="danger"
                variant="soft"
                onClick={() => removeApiKey(key.key)}
                disabled={loading}
                size="sm"
              >
                Remove
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: 'background.level1',
                  borderRadius: 'md',
                  fontFamily: 'monospace',
                  m: 0,
                  flex: 1,
                  fontSize: '0.75rem'
                }}
              >
                {visibleKeys[key._id] ? key.key : '•'.repeat(32)}
              </Typography>
              <IconButton
                onClick={() => toggleKeyVisibility(key._id)}
                sx={{ color: 'neutral.500' }}
                size="sm"
              >
                {visibleKeys[key._id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Box>
            {key.allowedOrigins?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {key.allowedOrigins.map(origin => (
                  <Typography
                    key={origin}
                    level="body-xs"
                    sx={{
                      p: 0.5,
                      borderRadius: 'sm',
                      bgcolor: 'background.level1',
                      fontSize: '0.75rem'
                    }}
                  >
                    {origin}
                  </Typography>
                ))}
              </Box>
            )}
          </Sheet>
        ))}
      </Box>
    </Box>
  );
};

export default ApiKeyManager;