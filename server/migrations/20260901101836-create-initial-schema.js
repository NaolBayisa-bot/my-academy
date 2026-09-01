"use strict";

// Initial schema baseline (bootstrap migration).
//
// Previously the schema was created only by `sequelize.sync()` with no version
// history. This baseline brings the schema under a proper, versioned migration
// framework (sequelize-cli / umzug). To preserve any pre-existing data on an
// already-provisioned database, each table is created only if missing
// (guarded via information_schema); on a fresh/empty database it creates all
// 8 tables from scratch.
//
// Table names and column types mirror the Sequelize models under
// src/models (same tableNames, enums, UUID PKs, FKs, indexes and CASCADE
// rules).
//
//   up   -> create any missing tables, then record the baseline as applied.
//   down -> safe no-op: because tables may have pre-existed this baseline
//           (made by a pre-migration sequelize.sync()), `undo` never
//           destructively drops tables, to avoid nuking pre-existing data.

const { DataTypes } = require("sequelize");

const TABLES = [
  "Users",
  "Categories",
  "Courses",
  "Modules",
  "Lessons",
  "Enrollments",
  "LessonProgresses",
  "Posts",
];

const SCHEMA = {
  Users: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("super_admin", "category_admin", "student"), allowNull: false, defaultValue: "student" },
    category_id: { type: DataTypes.UUID, allowNull: true },
    suspended: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  Categories: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    admin_id: { type: DataTypes.UUID, allowNull: true, references: { model: "Users", key: "id" } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  Courses: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    category_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Categories", key: "id" } },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: false, references: { model: "Users", key: "id" } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  Modules: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    course_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Courses", key: "id", onDelete: "CASCADE" } },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    order_index: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  Lessons: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    module_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Modules", key: "id", onDelete: "CASCADE" } },
    title: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM("video", "download"), allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    order_index: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  Enrollments: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    student_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Users", key: "id" } },
    course_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Courses", key: "id" } },
    status: { type: DataTypes.ENUM("pending", "in_progress", "completed", "rejected"), allowNull: false, defaultValue: "pending" },
    enrolled_at: { type: DataTypes.DATE, allowNull: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  LessonProgresses: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enrollment_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Enrollments", key: "id", onDelete: "CASCADE" } },
    lesson_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Lessons", key: "id", onDelete: "CASCADE" } },
    completed_at: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  // Note: Posts uses `created_at` (no updatedAt), matching the model.
  Posts: {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    author_id: { type: DataTypes.UUID, allowNull: false, references: { model: "Users", key: "id" } },
    category_id: { type: DataTypes.UUID, allowNull: true, references: { model: "Categories", key: "id" } },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  },
};

// to_regclass resolves names via the search_path and folds unquoted names to
// lowercase. Sequelize creates capitalized names (e.g. "Users"), so the
// identifier is double-quoted inside the string to preserve its exact case.
async function tableExists(queryInterface, tableName) {
  const [[row]] = await queryInterface.sequelize.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists_flag",
    { bind: ['"' + tableName + '"'] }
  );
  return row && row.exists_flag === true;
}

module.exports = {
  async up(queryInterface) {
    const created = [];
    for (const tableName of TABLES) {
      if (await tableExists(queryInterface, tableName)) {
        continue;
      }
      await queryInterface.createTable(tableName, SCHEMA[tableName]);
      created.push(tableName);
    }
    // eslint-disable-next-line no-console
    console.log(
      "[migration:create-initial-schema] ensured tables. " +
        (created.length ? "Created: " + created.join(", ") : "none (all already existed)")
    );
  },
  async down() {
    // Safe no-op: see file header.
  },
};
