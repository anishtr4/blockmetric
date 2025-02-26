const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const { v4: uuidv4 } = require('uuid');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(36),
    unique: true,
    allowNull: false,
    defaultValue: () => uuidv4()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  }
}, {
  tableName: 'api_keys',
  timestamps: false
});

// Static methods
ApiKey.create = async function({ name, userId }) {
  const apiKey = await this.create({
    name,
    userId,
    key: uuidv4()
  });
  return apiKey.toJSON();
};

ApiKey.findByKey = async function(key) {
  const apiKey = await this.findOne({
    where: { key },
    include: [{
      association: 'allowedOrigins',
      attributes: ['origin']
    }]
  });
  if (apiKey) {
    const data = apiKey.toJSON();
    data.allowedOrigins = data.allowedOrigins.map(ao => ao.origin);
    return data;
  }
  return null;
};

ApiKey.findByUserId = async function(userId) {
  const apiKeys = await this.findAll({
    where: { userId },
    include: [{
      association: 'allowedOrigins',
      attributes: ['origin']
    }]
  });
  return apiKeys.map(apiKey => {
    const data = apiKey.toJSON();
    data.allowedOrigins = data.allowedOrigins.map(ao => ao.origin);
    return data;
  });
};

ApiKey.updateAllowedOrigins = async function(apiKeyId, origins) {
  const transaction = await sequelize.transaction();
  try {
    const apiKey = await this.findByPk(apiKeyId, { transaction });
    if (!apiKey) throw new Error('API key not found');

    await apiKey.setAllowedOrigins([], { transaction });
    
    if (origins && origins.length > 0) {
      await Promise.all(origins.map(origin =>
        apiKey.createAllowedOrigin({ origin }, { transaction })
      ));
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

ApiKey.delete = async function(id) {
  return this.destroy({
    where: { id }
  });
};

module.exports = ApiKey;