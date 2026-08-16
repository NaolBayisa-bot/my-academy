const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  markLessonComplete,
  getProgress,
} = require('../controllers/progressController');

const router = express.Router();

// All lesson-progress routes are protected: only authenticated students
// may mark lessons complete or view their progress.

// POST /api/enrollments/:enrollmentId/lessons/:lessonId/complete
// Mark a lesson as complete for a given enrollment.
router.post(
  '/enrollments/:enrollmentId/lessons/:lessonId/complete',
  authenticate,
  authorize('student'),
  markLessonComplete
);

// GET /api/enrollments/:enrollmentId/progress
// Get progress summary for a given enrollment.
router.get(
  '/enrollments/:enrollmentId/progress',
  authenticate,
  authorize('student'),
  getProgress
);

module.exports = router;
