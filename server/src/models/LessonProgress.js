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
      // onDelete: 'CASCADE' so removing an enrollment clears its progress rows.
      references: {
        model: 'Enrollments',
        key: 'id',
        onDelete: 'CASCADE',
      },
    },
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Lessons.id (association defined in models/index.js).
      // onDelete: 'CASCADE' so removing a lesson clears its progress rows,
      // which in turn lets the Module -> Lesson cascade work end-to-end.
      references: {
        model: 'Lessons',
        key: 'id',
        onDelete: 'CASCADE',
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
