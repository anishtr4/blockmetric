const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  apiKey: { type: String, unique: true },
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: { type: Date, default: Date.now }
});

// Create indexes for frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ apiKey: 1 });

module.exports = mongoose.model('User', userSchema);