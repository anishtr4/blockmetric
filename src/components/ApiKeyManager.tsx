import React, { useState, useEffect } from 'react';
import { Box, Button, Input, Typography, Sheet } from '@mui/joy';
import { getApiKeys, createApiKey, deleteApiKey } from '../services/apiKeyService';

const ApiKeyManager = () => {
  interface ApiKey {
    id: string;
    value: string;
    allowedOrigins: string[];
  }

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newOrigin, setNewOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

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

  const addOrigin = async (keyId) => {
    if (!newOrigin) return;

    try {
      setLoading(true);
      await axios.post(`/api/keys/${keyId}/origins`, { origin: newOrigin });
      const updatedKeys = apiKeys.map(key => {
        if (key.id === keyId) {
          return {
            ...key,
            allowedOrigins: [...key.allowedOrigins, newOrigin]
          };
        }
        return key;
      });
      setApiKeys(updatedKeys);
      setNewOrigin('');
    } catch (err) {
      setError('Failed to add origin');
    } finally {
      setLoading(false);
    }
  };

  const removeOrigin = async (keyId, origin) => {
    try {
      setLoading(true);
      await axios.delete(`/api/keys/${keyId}/origins/${encodeURIComponent(origin)}`);
      const updatedKeys = apiKeys.map(key => {
        if (key.id === keyId) {
          return {
            ...key,
            allowedOrigins: key.allowedOrigins.filter(o => o !== origin)
          };
        }
        return key;
      });
      setApiKeys(updatedKeys);
    } catch (err) {
      setError('Failed to remove origin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography level="h2">API Key Management</Typography>
      
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
          borderRadius: 'sm'
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter API Key Name"
            disabled={loading}
            sx={{ mb: 1 }}
            fullWidth
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Input
            value={newAllowedOrigins}
            onChange={(e) => setNewAllowedOrigins(e.target.value)}
            placeholder="Enter allowed origins (comma-separated)"
            disabled={loading}
            sx={{ mb: 1 }}
            fullWidth
          />
        </Box>
        <Button 
          onClick={generateApiKey} 
          disabled={loading}
          loading={loading}
          sx={{ width: '100%' }}
        >
          Generate New API Key
        </Button>
      </Sheet>

      {loading && (
        <Typography level="body-sm" sx={{ textAlign: 'center', color: 'neutral.500' }}>
          Loading...
        </Typography>
      )}

      <Box sx={{ mt: 3 }}>
        {apiKeys.map(key => (
          <Sheet
            key={key.id}
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 'sm'
            }}
          >
            <Typography
              component="pre"
              sx={{
                p: 1,
                mb: 2,
                bgcolor: 'background.level1',
                borderRadius: 'sm',
                fontFamily: 'monospace'
              }}
            >
              {key.value}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography level="h4" sx={{ mb: 1 }}>Allowed Origins</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Input
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  placeholder="Enter new origin (e.g., https://example.com)"
                  sx={{ flexGrow: 1 }}
                />
                <Button 
                  onClick={() => addOrigin(key.id)}
                  disabled={loading || !newOrigin}
                >
                  Add Origin
                </Button>
              </Box>
              
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {key.allowedOrigins?.map(origin => (
                  <Box
                    key={origin}
                    component="li"
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {origin}
                    <Button
                      onClick={() => removeOrigin(key.id, origin)}
                      disabled={loading}
                      color="danger"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          </Sheet>
        ))}
      </Box>
    </Box>
  );
};

export default ApiKeyManager;