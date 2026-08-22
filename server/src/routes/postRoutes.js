const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPost, getPosts, deletePost } = require('../controllers/postController');

const router = express.Router();

// The router is mounted at `/api/posts` in src/index.js, so the full paths are:
//   POST   /api/posts
//   GET    /api/posts
//   DELETE /api/posts/:id

// POST /api/posts
// Create a new post/announcement — super_admin or category_admin only.
// Validation runs before auth so malformed input is rejected cheaply with 400.
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required.')
      .bail()
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters.'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Content is required.'),
    body('category_id')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('category_id must be a valid UUID.'),
  ],
  validate,
  authenticate,
  authorize('super_admin', 'category_admin'),
  createPost
);

// GET /api/posts
// List posts visible to the authenticated user — any role.
router.get('/', authenticate, getPosts);

// DELETE /api/posts/:id
// Delete a post — super_admin or category_admin only (and only the author or
// a super_admin can actually delete, enforced in the controller).
router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('A valid post id is required.'),
  ],
  validate,
  authenticate,
  authorize('super_admin', 'category_admin'),
  deletePost
);

module.exports = router;
