const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  url: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  sessionId: { type: String, required: true },
  // Performance metrics fields
  metricName: { type: String },
  value: { type: mongoose.Schema.Types.Mixed }, // Allow both number and string values
  // Resource timing fields
  resourceType: { type: String },
  resourceUrl: { type: String },
  duration: { type: Number },
  // Navigation timing fields
  dnsTime: { type: Number },
  tcpTime: { type: Number },
  ttfb: { type: Number },
  domLoadTime: { type: Number },
  loadTime: { type: Number },
  // Generic data field for additional properties
  data: { type: mongoose.Schema.Types.Mixed },
  apiKey: { type: String, required: true, index: true }
});

// Add indexes for common queries
eventSchema.index({ timestamp: -1 });
eventSchema.index({ apiKey: 1, timestamp: -1 });
eventSchema.index({ eventName: 1, apiKey: 1 });

// Pre-save middleware to ensure data consistency
eventSchema.pre('save', function(next) {
  // Convert undefined values to null
  for (let path in this.schema.paths) {
    if (this[path] === undefined) {
      this[path] = null;
    }
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);