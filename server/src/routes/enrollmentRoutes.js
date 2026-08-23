const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { enrollInCourse } = require('../controllers/enrollmentController');

const router = express.Router();

// POST /api/enrollments
// Enroll a student in a course. Only authenticated students can enroll.
router.post('/', authenticate, authorize('student'), enrollInCourse);

module.exports = router;
