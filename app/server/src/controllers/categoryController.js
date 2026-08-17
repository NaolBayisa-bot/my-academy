const { Category } = require('../models');

// GET /api/categories
// Public endpoint that returns all categories (id + name). Used by the
// student "select category" page to render the selectable cards.
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    return res.status(200).json({ categories });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};