const express = require('express');
const router = express.Router();
const ApiKey = require('../models/ApiKey');
const { authenticateToken } = require('../middleware/auth');

// Get all websites for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll({
      where: { userId: req.user.id }
    });
    const mappedApiKeys = apiKeys.map(apiKey => ({
      id: apiKey.id,
      value: apiKey.key,
      name: apiKey.name,
      allowedOrigins: apiKey.allowedOrigins || []
    }));
    res.json(mappedApiKeys);
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new website
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, allowedOrigins } = req.body;
    const apiKey = await ApiKey.create({
      name,
      userId: req.user.id
    });

    res.status(201).json({
      id: apiKey.id,
      value: apiKey.key,
      name: apiKey.name,
      allowedOrigins: allowedOrigins || []
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'API key already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;