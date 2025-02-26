const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const UserSession = sequelize.define('UserSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'session_id'
  },
  apiKeyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'api_key_id',
    references: {
      model: 'api_keys',
      key: 'id'
    }
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_activity'
  },
  // createdAt: {
  //   type: DataTypes.DATE,
  //   allowNull: false,
  //   field: 'created_at'
  // },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'user_sessions',
  timestamps: true
});

// Define associations
UserSession.associate = (models) => {
  UserSession.belongsTo(models.ApiKey, {
    foreignKey: 'apiKeyId',
    as: 'apiKey'
  });
  UserSession.hasMany(models.Event, {
    foreignKey: 'sessionId',
    as: 'events'
  });
};

module.exports = UserSession;