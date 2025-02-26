const sequelize = require('../db/sequelize');
const ApiKey = require('./ApiKey');
const Event = require('./Event');
const UserSession = require('./UserSession');
const AllowedOrigin = require('./AllowedOrigin');

// Initialize all model associations
const models = {
  ApiKey,
  Event,
  UserSession,
  AllowedOrigin
};

// Call associate method on each model that has it
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Define associations
ApiKey.hasMany(UserSession, {
  foreignKey: 'apiKeyId',
  as: 'sessions'
});

UserSession.belongsTo(ApiKey, {
  foreignKey: 'apiKeyId',
  as: 'sessionApiKey'
});

UserSession.hasMany(Event, {
  foreignKey: 'sessionId',
  as: 'sessionEvents'
});

Event.belongsTo(UserSession, {
  foreignKey: 'sessionId',
  as: 'session'
});

Event.belongsTo(ApiKey, {
  foreignKey: 'apiKeyId',
  as: 'eventApiKey'
});

// Set up ApiKey and AllowedOrigin association
ApiKey.hasMany(AllowedOrigin, {
  foreignKey: 'apiKeyId',
  as: 'allowedOrigins'
});

AllowedOrigin.belongsTo(ApiKey, {
  foreignKey: 'apiKeyId',
  as: 'apiKey'
});

module.exports = {
  sequelize,
  ...models
};