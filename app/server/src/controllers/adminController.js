const { User, Category, sequelize } = require('../models');

// Strip sensitive fields from a user instance before sending it in a response.
const serializeUser = (user) => {
  const { password_hash, ...publicFields } = user.toJSON();
  return publicFields;
};

// PATCH /api/admin/assign-category-admin
// Reassigns an existing user to be a category admin for the given category,
// and marks that category as administered by the user. Protected by
// `authenticate` + `authorize('super_admin')`.
exports.assignCategoryAdmin = async (req, res) => {
  const { userId, categoryId } = req.body;

  if (!userId || !categoryId) {
    return res
      .status(400)
      .json({ error: 'userId and categoryId are required.' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // A super_admin cannot be demoted/purposed as a category admin.
    if (user.role === 'super_admin') {
      return res
        .status(400)
        .json({ error: 'Cannot reassign a super_admin to a category admin.' });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Keep the two related writes atomic.
    await sequelize.transaction(async (t) => {
      await user.update(
        { role: 'category_admin', category_id: categoryId },
        { transaction: t }
      );
      await category.update({ admin_id: userId }, { transaction: t });
    });

    return res.status(200).json({
      message: 'User assigned as category admin.',
      user: serializeUser(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
