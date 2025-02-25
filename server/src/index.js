require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const analyticsRoutes = require('./routes/analyticsRoutes');
const websitesRoutes = require('./routes/websites');
const ApiKey = require('./models/ApiKey');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockmetric')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/websites', websitesRoutes);

// Import User model
const User = require('./models/User');

// Middleware to verify JWT
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

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate API key
    const apiKey = uuidv4();

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      apiKey
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Create and assign token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        apiKey: user.apiKey
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Store reset token and expiry in user document
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send reset password email with token
    // For now, just return success response
    res.json({ message: 'Password reset instructions sent' });
  } catch (error) {
    res.status(500).json({ error: 'Error processing password reset' });
  }
});

// Verify reset token endpoint
app.get('/api/auth/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying token' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Error resetting password' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying token' });
  }
});

// Protected route example
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});


// Update validateApiKey middleware to use MongoDB
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

    // Validate origin if specified
    const origin = req.headers.origin;
    if (keyData.allowedOrigins && keyData.allowedOrigins.length > 0) {
      if (!origin || !keyData.allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }

    req.apiKeyData = keyData;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error validating API key' });
  }
};

// Update API Key Management endpoints
app.post('/api/keys', authenticateToken, async (req, res) => {
  try {
    const { name, allowedOrigins } = req.body;
    const key = uuidv4();
    
    const apiKey = new ApiKey({
      key,
      name,
      allowedOrigins: allowedOrigins || [],
      userId: req.user.id
    });

    await apiKey.save();
    res.json({ apiKey: key });
  } catch (error) {
    res.status(500).json({ error: 'Error creating API key' });
  }
});

app.get('/api/keys', authenticateToken, async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user.id });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching API keys' });
  }
});

app.delete('/api/keys/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const result = await ApiKey.findOneAndDelete({ key, userId: req.user.id });
    
    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting API key' });
  }
});

// Update Analytics endpoints
app.post('/api/events', validateApiKey, async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      apiKey: req.headers['x-api-key']
    });
    
    await event.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error tracking event' });
  }
});

app.post('/api/pageviews', validateApiKey, async (req, res) => {
  try {
    const pageview = new Pageview({
      ...req.body,
      apiKey: req.headers['x-api-key']
    });
    
    await pageview.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error tracking pageview' });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});