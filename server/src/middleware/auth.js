const ApiKey = require('../models/ApiKey');
const jwt = require('jsonwebtoken');

const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const keyData = await ApiKey.findOne({ key: apiKey });
    if (!keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // // Validate origin if specified
    // const origin = req.headers.origin;
    // if (keyData.allowedOrigins && keyData.allowedOrigins.length > 0) {
    //   if (!origin || !keyData.allowedOrigins.includes(origin)) {
    //     return res.status(403).json({ error: 'Origin not allowed' });
    //   }
    // }

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