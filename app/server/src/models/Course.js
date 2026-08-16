const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Course = sequelize.define(
  'Course',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Categories.id (association defined in models/index.js).
      references: {
        model: 'Categories',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      // References the user who created the course.
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'Courses',
  }
);

module.exports = Course;
