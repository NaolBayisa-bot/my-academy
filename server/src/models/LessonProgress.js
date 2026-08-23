const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

const LessonProgress = sequelize.define(
  'LessonProgress',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    enrollment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Enrollments.id (association defined in models/index.js).
      references: {
        model: 'Enrollments',
        key: 'id',
      },
    },
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Lessons.id (association defined in models/index.js).
      references: {
        model: 'Lessons',
        key: 'id',
      },
    },
    completed_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
  },
  {
    tableName: 'LessonProgresses',
  }
);

module.exports = LessonProgress;
