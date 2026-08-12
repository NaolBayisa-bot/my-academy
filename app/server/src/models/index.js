const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const basename = path.basename(__filename);
const db = {};

// Load all model files in this directory (except this index file) onto the
// shared Sequelize instance, then expose them together with sequelize.
  fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.js') && file !== basename)
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Define associations between models. This is centralized here (after all
// models are loaded) to avoid circular require() dependencies between model
// files.
const { User, Category } = db;

if (Category && User) {
  // A Category is administered by a User (admin_id -> Users.id).
  // Accessible as category.admin.
  Category.belongsTo(User, { as: 'admin', foreignKey: 'admin_id' });

  // A User may belong to a Category (category_id -> Categories.id), reusing
  // the existing category_id column on the User model.
  User.belongsTo(Category, { foreignKey: 'category_id' });
}

module.exports = {
  ...db,
  sequelize,
  Sequelize,
};
