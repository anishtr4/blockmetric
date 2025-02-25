const mongoose = require('mongoose');

const pageviewSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: String,
  referrer: String,
  timestamp: { type: Date, required: true },
  sessionId: { type: String, required: true },
  userAgent: String,
  apiKey: { type: String, required: true }
});

module.exports = mongoose.model('Pageview', pageviewSchema);