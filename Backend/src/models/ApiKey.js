const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  allowedOrigins: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create indexes for frequently queried fields
apiKeySchema.index({ key: 1 });
apiKeySchema.index({ userId: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);