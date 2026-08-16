const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lesson = sequelize.define(
  'Lesson',
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
      references: {
        model: 'Courses',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('video', 'download'),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'Lessons',
  }
);

module.exports = Lesson;
