const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createCourse,
  getCoursesByCategory,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

const router = express.Router();

// POST /api/courses
// Create a new course — super_admin or category_admin only.
// Validation rules: category_id (required, UUID) and title (required) are
// validated before auth so malformed input is rejected cheaply with a 400.
router.post(
  '/',
  [
    body('category_id')
      .notEmpty()
      .withMessage('category_id is required.')
      .bail()
      .isUUID()
      .withMessage('category_id must be a valid UUID.'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required.')
      .bail()
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters.'),
    body('description').optional().trim(),
  ],
  validate,
  authenticate,
  authorize('super_admin', 'category_admin'),
  createCourse
);

// GET /api/courses?categoryId=<uuid>
// List courses in a category — any authenticated role.
router.get('/', authenticate, getCoursesByCategory);

// PATCH /api/courses/:id
// Update a course — super_admin or category_admin only.
router.patch(
  '/:id',
  authenticate,
  authorize('super_admin', 'category_admin'),
  updateCourse
);

// DELETE /api/courses/:id
// Delete a course — super_admin or category_admin only.
router.delete(
  '/:id',
  authenticate,
  authorize('super_admin', 'category_admin'),
  deleteCourse
);

module.exports = router;

