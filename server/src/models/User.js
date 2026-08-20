const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'category_admin', 'student'),
      defaultValue: 'student',
      allowNull: false,
    },
    // Soft-deactivation flag. A suspended user is blocked from the platform but
    // their data is preserved, so the account can be restored to its original
    // state. Permanently deleting a user instead removes them entirely.
    status: {
      type: DataTypes.ENUM('active', 'suspended'),
      defaultValue: 'active',
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Foreign key to Categories.id (association defined in models/index.js).
      // The DB-level FK is created on sync() once the Categories table exists.
    },
  },
  {
    tableName: 'Users',
  }
);

module.exports = User;
