const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const Module = sequelize.define(
  'Module',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Courses.id (association defined in models/index.js).
      // onDelete: 'CASCADE' so removing a course clears its modules (and
      // transitively their lessons and lesson-progress rows).
      references: {
        model: 'Courses',
        key: 'id',
        onDelete: 'CASCADE',
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
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'Modules',
  }
);

module.exports = Module;