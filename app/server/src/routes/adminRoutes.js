const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { assignCategoryAdmin } = require('../controllers/adminController');

const router = express.Router();

// Protected route: only a super_admin can assign category admins.
router.patch(
  '/assign-category-admin',
  authenticate,
  authorize('super_admin'),
  assignCategoryAdmin
);

module.exports = router;
