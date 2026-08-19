const { Category, User } = require('../models');

// GET /api/categories
// Public endpoint that returns all categories (id + name). Used by the
// student "select category" page to render the selectable cards.
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name'],
      // Eager-load the admin that currently administers each category so the
      // super-admin "Assign Admins" page can show the current admin per
      // category. `admin_id` on Category references Users.id (see
      // models/index.js: Category.belongsTo(User, { as: 'admin',
      // foreignKey: 'admin_id' })). Only public fields are selected — no
      // password_hash ever leaks. `admin` is null when a category is unassigned.
      include: [
        { model: User, as: 'admin', attributes: ['id', 'name', 'email'] },
      ],
      order: [['name', 'ASC']],
    });

    return res.status(200).json({ categories });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};