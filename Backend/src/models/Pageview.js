const mongoose = require('mongoose');

const pageviewSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: String,
  referrer: String,
  timestamp: { type: Date, required: true },
  sessionId: { type: String, required: true },
  visitorId: { type: String, required: true },
  pageViewId: { type: String, required: true },
  userAgent: String,
  screenResolution: String,
  language: String,
  timezone: String,
  connectionType: String,
  pageLoadTime: Number,
  apiKey: { type: String, required: true },
  ipAddress: { type: String, select: false }, // Store IP but exclude from queries by default
  lastVisit: { type: Date, default: Date.now }
});

// Index for efficient querying
pageviewSchema.index({ apiKey: 1, timestamp: -1 });
pageviewSchema.index({ visitorId: 1, timestamp: -1 });

module.exports = mongoose.model('Pageview', pageviewSchema);