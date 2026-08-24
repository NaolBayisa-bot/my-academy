const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  assignCategoryAdmin,
  deassignCategoryAdmin,
  getStudentsByCategory,
  getAllStudents,
  getOverview,
  getCategoryStats,
  suspendStudent,
  unsuspendStudent,
  deleteStudent,
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

// PATCH /api/admin/deassign-category-admin
// Inverse of assign-category-admin: clears a category's admin (reverts the
// user's role back to 'student'). Only a super_admin can perform this.
router.patch(
  '/deassign-category-admin',
  authenticate,
  authorize('super_admin'),
  deassignCategoryAdmin
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

// GET /api/admin/students
// Returns all students across all categories, grouped by category_id.
// Super_admin only.
router.get('/students', authenticate, authorize('super_admin'), getAllStudents);

// GET /api/admin/category-stats
// Statistical summary for the admin dashboard. category_admin: scoped to
// their own category. super_admin without a category: global numbers.
router.get(
  '/category-stats',
  authenticate,
  authorize('super_admin', 'category_admin'),
  getCategoryStats
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

// --- Student management routes (super_admin only) ---

// PATCH /api/admin/students/:id/suspend
// Suspends a student by setting suspended=true.
router.patch(
  '/students/:id/suspend',
  authenticate,
  authorize('super_admin'),
  suspendStudent
);

// PATCH /api/admin/students/:id/unsuspend
// Unsuspends a student by setting suspended=false.
router.patch(
  '/students/:id/unsuspend',
  authenticate,
  authorize('super_admin'),
  unsuspendStudent
);

// DELETE /api/admin/students/:id
// Permanently deletes a student and all their associated data.
router.delete(
  '/students/:id',
  authenticate,
  authorize('super_admin'),
  deleteStudent
);

module.exports = router;
