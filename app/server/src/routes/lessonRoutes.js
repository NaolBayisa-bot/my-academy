const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createLesson,
  getLessonsByCourse,
  updateLesson,
  deleteLesson,
} = require('../controllers/lessonController');

const router = express.Router();

// All lesson routes are protected: only super_admin or category_admin may
// interact with lessons. The router is mounted at /api in src/index.js, so
// the full paths are:
//   POST   /api/courses/:courseId/lessons
//   GET    /api/courses/:courseId/lessons
//   PATCH  /api/lessons/:id
//   DELETE /api/lessons/:id

// POST /api/courses/:courseId/lessons
// Create a lesson within a specific course.
// `courseId` is taken from the URL and validated as a UUID; the body fields
// (title, type, url) are required, `order_index` is optional. Input is
// validated before auth so malformed payloads are rejected cheaply with 400.
router.post(
  '/courses/:courseId/lessons',
  [
    param('courseId')
      .isUUID()
      .withMessage('A valid courseId is required.'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required.')
      .bail()
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters.'),
    body('type')
      .notEmpty()
      .withMessage('Type is required.')
      .bail()
      .isIn(['video', 'download'])
      .withMessage("Type must be either 'video' or 'download'."),
    body('url')
      .notEmpty()
      .withMessage('URL is required.')
      .bail()
      .isURL()
      .withMessage('A valid URL is required.'),
    body('order_index')
      .optional()
      .isInt()
      .withMessage('order_index must be an integer.'),
  ],
  validate,
  authenticate,
  authorize('super_admin', 'category_admin'),
  createLesson
);

// GET /api/courses/:courseId/lessons
// List all lessons for a specific course.
router.get(
  '/courses/:courseId/lessons',
  authenticate,
  authorize('super_admin', 'category_admin'),
  getLessonsByCourse
);

// PATCH /api/lessons/:id
// Update a lesson by id.
router.patch(
  '/lessons/:id',
  authenticate,
  authorize('super_admin', 'category_admin'),
  updateLesson
);

// DELETE /api/lessons/:id
// Delete a lesson by id.
router.delete(
  '/lessons/:id',
  authenticate,
  authorize('super_admin', 'category_admin'),
  deleteLesson
);

module.exports = router;
