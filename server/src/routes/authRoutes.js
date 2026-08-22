const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
// Validation rules: name, email (format), and password (min length) are
// required. express-validator runs the chains, then `validate` returns a
// consistent 400 `{ error: "..." }` on failure, or continues to `register`.
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required.'),
    body('email')
      .notEmpty()
      .withMessage('Email is required.')
      .bail()
      .isEmail()
      .withMessage('Please provide a valid email.'),
    body('password')
      .notEmpty()
      .withMessage('Password is required.')
      .bail()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  register
);

// POST /api/auth/login
// Validation rules: a valid email and a non-empty password.
router.post(
  '/login',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required.')
      .bail()
      .isEmail()
      .withMessage('Please provide a valid email.'),
    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
  ],
  validate,
  login
);

router.get('/me', authenticate, getMe);

module.exports = router;


