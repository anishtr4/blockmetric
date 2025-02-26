const { DataTypes, Op } = require('sequelize');
const sequelize = require('../db/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    unique: true,
    field: 'api_key'
  },
  resetToken: {
    type: DataTypes.STRING,
    field: 'reset_token'
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    field: 'reset_token_expiry'
  },
  // createdAt: {
  //   type: DataTypes.DATE,
  //   allowNull: false,
  //   defaultValue: DataTypes.NOW,
  //   field: 'created_at'
  // }
}, {
  tableName: 'users',
  timestamps: true,
  updatedAt: false
});

// Instance method to compare password
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Static methods from UserMySQL.js
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findByApiKey = function(apiKey) {
  return this.findOne({ where: { apiKey } });
};

User.findByResetToken = function(token) {
  return this.findOne({
    where: {
      resetToken: token,
      resetTokenExpiry: { [Op.gt]: new Date() }
    }
  });
};

User.updateResetToken = async function(email, resetToken, expiry) {
  return this.update(
    { resetToken, resetTokenExpiry: expiry },
    { where: { email } }
  );
};

User.updatePassword = async function(userId, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return this.update(
    { 
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    },
    { where: { id: userId } }
  );
};

User.setApiKey = async function(userId, apiKey) {
  return this.update(
    { apiKey },
    { where: { id: userId } }
  );
};

// Hook to hash password before save
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Hook to hash password before update
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

module.exports = User;