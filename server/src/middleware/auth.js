const ApiKey = require('../models/ApiKeyMySQL');
const jwt = require('jsonwebtoken');

const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const keyData = await ApiKey.findByKey(apiKey);
    if (!keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Enhanced origin validation for web, mobile, and desktop apps
    if (keyData.allowedOrigins && keyData.allowedOrigins.length > 0) {
      const origin = req.headers.origin || req.headers['x-app-identifier'] || '';
      const isAllowed = keyData.allowedOrigins.some(allowedOrigin => {
        // Handle web origins (http/https)
        if (allowedOrigin.startsWith('http')) {
          return origin === allowedOrigin;
        }
        // Handle mobile app schemes (e.g., myapp://, com.myapp://)
        if (allowedOrigin.endsWith('://')) {
          return origin.startsWith(allowedOrigin);
        }
        // Handle electron app identifiers (e.g., electron-myapp)
        if (allowedOrigin.startsWith('electron-')) {
          return origin === allowedOrigin;
        }
        return false;
      });

      if (!isAllowed) {
        return res.status(403).json({ error: 'Origin or app identifier not allowed' });
      }
    }

    req.apiKeyData = keyData;
    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Error validating API key' });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

module.exports = { validateApiKey, authenticateToken };