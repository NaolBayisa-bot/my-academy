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
const { User, Category, Course, Lesson, Enrollment, LessonProgress, Post } = db;

if (Category && User) {
  // A Category is administered by a User (admin_id -> Users.id).
  // Accessible as category.admin.
  Category.belongsTo(User, { as: 'admin', foreignKey: 'admin_id' });

  // A User may belong to a Category (category_id -> Categories.id), reusing
  // the existing category_id column on the User model.
  User.belongsTo(Category, { foreignKey: 'category_id' });
}

if (Course && Category && User) {
  // A Course belongs to a Category (category_id -> Categories.id).
  Course.belongsTo(Category, { foreignKey: 'category_id' });

  // A Course was created by a User (created_by -> Users.id).
  // Accessible as course.creator.
  Course.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

  // A Category has many Courses.
  Category.hasMany(Course, { foreignKey: 'category_id' });

  // A User (as creator) has many Courses.
  User.hasMany(Course, { as: 'createdCourses', foreignKey: 'created_by' });
}

if (Lesson && Course) {
  // A Lesson belongs to a Course (course_id -> Courses.id).
  // Accessible as lesson.course.
  Lesson.belongsTo(Course, { foreignKey: 'course_id' });

  // A Course has many Lessons.
  Course.hasMany(Lesson, { foreignKey: 'course_id' });
}

if (Enrollment && User && Course) {
  // An Enrollment belongs to a Student (User) and a Course.
  // Accessible as enrollment.student and enrollment.course.
  Enrollment.belongsTo(User, { as: 'student', foreignKey: 'student_id' });
  Enrollment.belongsTo(Course, { foreignKey: 'course_id' });

  // A Student has many Enrollments.
  User.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'student_id' });

  // A Course has many Enrollments.
  Course.hasMany(Enrollment, { foreignKey: 'course_id' });
}

if (LessonProgress && Enrollment && Lesson) {
  // A LessonProgress belongs to an Enrollment and a Lesson.
  LessonProgress.belongsTo(Enrollment, { foreignKey: 'enrollment_id' });
  LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id' });

  // An Enrollment has many LessonProgresses.
  Enrollment.hasMany(LessonProgress, { foreignKey: 'enrollment_id' });

  // A Lesson has many LessonProgresses.
  Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_id' });
}

if (Post && User) {
  // A Post is authored by a User (author_id -> Users.id).
  // Accessible as post.author.
  Post.belongsTo(User, { as: 'author', foreignKey: 'author_id' });

  // A User (as author) has many Posts.
  // Accessible as user.posts.
  User.hasMany(Post, { as: 'posts', foreignKey: 'author_id' });
}

if (Post && Category) {
  // A Post belongs to a Category (category_id -> Categories.id).
  // A null category_id means the post is global (visible to everyone).
  // Accessible as post.category.
  Post.belongsTo(Category, { foreignKey: 'category_id' });

  // A Category has many Posts.
  Category.hasMany(Post, { foreignKey: 'category_id' });
}

module.exports = {
  ...db,
  sequelize,
  Sequelize,
};
