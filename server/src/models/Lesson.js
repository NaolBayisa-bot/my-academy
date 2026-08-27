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
    module_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Modules.id (association defined in models/index.js).
      // A lesson always lives inside a module of a course.
      // onDelete: 'CASCADE' keeps this consistent with the migration script
      // (migrate-lessons-to-modules.js) and the moduleController's expectation
      // that deleting a module also deletes its lessons.
      references: {
        model: 'Modules',
        key: 'id',
        onDelete: 'CASCADE',
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
