const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  assignCategoryAdmin,
  getStudentsByCategory,
  getOverview,
} = require('../controllers/adminController');
const {
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
} = require('../controllers/enrollmentAdminController');

const router = express.Router();

// PATCH /api/admin/assign-category-admin
// Reassigns an existing user to be a category admin for the given category.
// Only a super_admin can perform this action.
router.patch(
  '/assign-category-admin',
  authenticate,
  authorize('super_admin'),
  assignCategoryAdmin
);

// GET /api/admin/category/:categoryId/students
// Returns all students in a category with their enrollment status.
// super_admin: any category | category_admin: own category only.
router.get(
  '/category/:categoryId/students',
  authenticate,
  authorize('super_admin', 'category_admin'),
  getStudentsByCategory
);

// GET /api/admin/overview
// Dashboard-level counts: total students, total courses, completions per
// category. Super_admin only.
router.get(
  '/overview',
  authenticate,
  authorize('super_admin'),
  getOverview
);

// --- Enrollment admin routes ---

// GET /api/admin/enrollments/pending
// Returns all pending enrollments. Super_admin sees all (optionally
// filtered by ?categoryId=). Category_admin sees only their own category's
// pending enrollments.
router.get(
  '/enrollments/pending',
  authenticate,
  authorize('super_admin', 'category_admin'),
  getPendingEnrollments
);

// PATCH /api/admin/enrollments/:id/approve
// Approves a pending enrollment → status becomes 'in_progress'.
// Super_admin can approve any; category_admin only within their own category.
router.patch(
  '/enrollments/:id/approve',
  authenticate,
  authorize('super_admin', 'category_admin'),
  approveEnrollment
);

// PATCH /api/admin/enrollments/:id/reject
// Rejects a pending enrollment → status becomes 'rejected'.
// Accepts an optional `reason` in the body.
// Super_admin can reject any; category_admin only within their own category.
router.patch(
  '/enrollments/:id/reject',
  authenticate,
  authorize('super_admin', 'category_admin'),
  rejectEnrollment
);

module.exports = router;
