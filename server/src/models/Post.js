const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Announcement/post model.
//
//  - author_id  -> Users.id  (who wrote the post)
//  - category_id -> Categories.id (null means the post is GLOBAL, i.e. visible
//    to every user regardless of category)
//
// The Post<->User and Post<->Category associations are wired up centrally in
// src/models/index.js so this file stays free of circular requires.
const Post = sequelize.define(
  'Post',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // References Users.id (association defined in models/index.js).
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // null  => global post, visible to all users.
      // References Categories.id (association defined in models/index.js).
      references: {
        model: 'Categories',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
  },
  {
    tableName: 'Posts',
  }
);

module.exports = Post;
