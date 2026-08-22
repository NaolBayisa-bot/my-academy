const express = require('express');
const { getCategories } = require('../controllers/categoryController');

const router = express.Router();

// GET /api/categories
// Public: returns all categories (id + name).
router.get('/', getCategories);

module.exports = router;