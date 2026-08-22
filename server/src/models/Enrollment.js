const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

const Enrollment = sequelize.define(
  'Enrollment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Users.id (association defined in models/index.js).
      references: {
        model: 'Users',
        key: 'id',
      },
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
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    enrolled_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'Enrollments',
  }
);

module.exports = Enrollment;
