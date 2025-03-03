const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true,
    unique: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    trackPageViews: {
      type: Boolean,
      default: true
    },
    trackEvents: {
      type: Boolean,
      default: true
    },
    trackPerformance: {
      type: Boolean,
      default: true
    }
  }
});

module.exports = mongoose.model('Website', websiteSchema);