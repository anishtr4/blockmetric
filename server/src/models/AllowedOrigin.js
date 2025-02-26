const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const AllowedOrigin = sequelize.define('AllowedOrigin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  origin: {
    type: DataTypes.STRING,
    allowNull: false
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
//   createdAt: {
//     type: DataTypes.DATE,
//     allowNull: false,
//     defaultValue: DataTypes.NOW,
//     field: 'created_at'
//   },
//   updatedAt: {
//     type: DataTypes.DATE,
//     allowNull: false,
//     defaultValue: DataTypes.NOW,
//     field: 'updated_at'
//   }
}, {
  tableName: 'allowed_origins',
  timestamps: true
});

module.exports = AllowedOrigin;