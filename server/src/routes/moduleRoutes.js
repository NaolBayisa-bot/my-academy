const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule,
} = require('../controllers/moduleController');

const router = express.Router();

// Module routes. Mounted at /api in src/index.js:
//   POST   /api/courses/:courseId/modules
//   GET    /api/courses/:courseId/modules
//   PATCH  /api/modules/:id
//   DELETE /api/modules/:id

router.post(
  '/courses/:courseId/modules',
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
    body('description').optional().trim(),
    body('order_index')
      .optional()
      .isInt()
      .withMessage('order_index must be an integer.'),
  ],
  validate,
  authenticate,
  authorize('super_admin', 'category_admin'),
  createModule
);

router.get(
  '/courses/:courseId/modules',
  authenticate,
  authorize('super_admin', 'category_admin'),
  getModulesByCourse
);

router.patch(
  '/modules/:id',
  authenticate,
  authorize('super_admin', 'category_admin'),
  updateModule
);

router.delete(
  '/modules/:id',
  authenticate,
  authorize('super_admin', 'category_admin'),
  deleteModule
);

module.exports = router;
