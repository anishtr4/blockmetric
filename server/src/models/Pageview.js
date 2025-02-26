const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Pageview = sequelize.define('Pageview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  page_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'session_id',
    references: {
      model: 'user_sessions',
      key: 'id'
    }
  },
  apiKeyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'api_key',
    references: {
      model: 'api_keys',
      key: 'id'
    }
  },
  visitorId: {
    type: DataTypes.STRING,
    field: 'visitorId',
    allowNull: false
  },
  userAgent: {
    type: DataTypes.STRING,
    field: 'user_agent',
    allowNull: true
  },
  screenResolution: {
    type: DataTypes.STRING,
    field: 'screen_resolution',
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  connectionType: {
    type: DataTypes.STRING,
    field: 'connection_type',
    allowNull: true
  },
  pageLoadTime: {
    type: DataTypes.INTEGER,
    field: 'page_load_time',
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    field: 'ip_address',
    allowNull: true
  },
  lastVisit: {
    type: DataTypes.DATE,
    field: 'last_visit',
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // createdAt: {
  //   type: DataTypes.DATE,
  //   allowNull: false,
  //   defaultValue: DataTypes.NOW,
  //   field: 'created_at'
  // },
  // updatedAt: {
  //   type: DataTypes.DATE,
  //   allowNull: false,
  //   defaultValue: DataTypes.NOW,
  //   field: 'updated_at'
  // }
}, {
  tableName: 'pageviews',
  timestamps: true,
  indexes: [
    {
      fields: ['api_key', 'created_at']
    },
    {
      fields: ['visitor_id', 'created_at']
    }
  ]
});

// Define associations
Pageview.associate = (models) => {
  Pageview.belongsTo(models.UserSession, {
    foreignKey: 'sessionId',
    as: 'session'
  });
  Pageview.belongsTo(models.ApiKey, {
    foreignKey: 'apiKeyId',
    as: 'apiKey'
  });
};

module.exports = Pageview;