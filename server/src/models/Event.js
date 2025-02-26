const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'event_type'
  },
  pageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'page_url'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    field: 'timestamp'
  },
  sessionId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'session_id'
  },
  userAgent: {
    type: DataTypes.STRING,
    field: 'user_agent'
  },
  ipAddress: {
    type: DataTypes.STRING,
    field: 'ip_address'
  },
  referrer: {
    type: DataTypes.STRING,
    field: 'referrer'
  },
  resourceType: {
    type: DataTypes.STRING,
    field: 'resource_type'
  },
  resourceUrl: {
    type: DataTypes.STRING,
    field: 'resource_url'
  },
  resourceSize: {
    type: DataTypes.INTEGER,
    field: 'resource_size'
  },
  resourceTiming: {
    type: DataTypes.JSON,
    field: 'resource_timing'
  },
  visitorId: {
    type: DataTypes.STRING,
    field: 'visitor_id'
  },
  apiKeyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'api_key_id',
    references: {
      model: 'api_keys',
      key: 'id'
    }
  }
}, {
  tableName: 'analytics_events',
  timestamps: false
});

module.exports = Event;