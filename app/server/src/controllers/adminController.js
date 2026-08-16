const { User, Category, Course, Enrollment, sequelize } = require('../models');

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

// GET /api/admin/category/:categoryId/students
// Returns all students in a given category along with their enrollment
// status. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can view students in any category.
//  - category_admin: can only view students in their own category. A
//    mismatch yields 403.
exports.getStudentsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Re-fetch the authenticated user to check role and category_id
    // (the JWT payload only carries { id, role }).
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Permission: category_admin may only view students in their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== categoryId
    ) {
      return res.status(403).json({
        error:
          'Category admin can only view students in their own category.',
      });
    }

    // Fetch all students in the given category, including their enrollments
    // (with course info) so the admin can see each student's current status.
    const students = await User.findAll({
      where: { category_id: categoryId, role: 'student' },
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          attributes: ['id', 'course_id', 'status', 'enrolled_at', 'completed_at'],
          include: [
            {
              model: Course,
              attributes: ['id', 'title'],
            },
          ],
        },
      ],
    });

    return res.status(200).json({ students });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/admin/overview
// Returns dashboard-level counts: total students, total courses, and total
// completions per category. Protected by `authenticate` +
// `authorize('super_admin')`.
exports.getOverview = async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalCourses = await Course.count();

    // Completions per category: iterate over all categories and count
    // completed enrollments whose course falls in that category.
    const categories = await Category.findAll({
      attributes: ['id', 'name'],
    });

    const completionsPerCategory = [];
    for (const category of categories) {
      const categoryCourses = await Course.findAll({
        where: { category_id: category.id },
        attributes: ['id'],
      });
      const courseIds = categoryCourses.map((c) => c.id);

      const completions = await Enrollment.count({
        where: { status: 'completed', course_id: courseIds },
      });

      completionsPerCategory.push({
        category_id: category.id,
        name: category.name,
        completions,
      });
    }

    return res.status(200).json({
      totalStudents,
      totalCourses,
      completionsPerCategory,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
