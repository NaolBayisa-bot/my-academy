const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  selectCategory,
  getMyCategoryCourses,
  getMyEnrollment,
  getMyHistory,
} = require('../controllers/studentController');

const router = express.Router();

// POST /api/students/select-category
// Protected: only authenticated students can select a category.
router.post(
  '/select-category',
  authenticate,
  authorize('student'),
  selectCategory
);

// GET /api/students/my-category-courses
// Returns all courses in the student's own category.
router.get(
  '/my-category-courses',
  authenticate,
  authorize('student'),
  getMyCategoryCourses
);

// GET /api/students/my-enrollment
// Returns the student's current in_progress enrollment (with course, lessons,
// and progress), or null if none.
router.get(
  '/my-enrollment',
  authenticate,
  authorize('student'),
  getMyEnrollment
);

// GET /api/students/my-history
// Returns all of the student's past completed enrollments.
router.get(
  '/my-history',
  authenticate,
  authorize('student'),
  getMyHistory
);

module.exports = router;
