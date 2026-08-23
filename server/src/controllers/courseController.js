const { User, Category, Course } = require('../models');

// POST /api/courses
// Creates a new course. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can create a course in any category.
//  - category_admin: can create a course only when the requested
//    `category_id` matches their own `category_id`. A mismatch yields 403.
//
// `created_by` is always set to the authenticated user (from the JWT / DB),
// never trusted from the request body.
exports.createCourse = async (req, res, next) => {
  const { category_id, title, description } = req.body;

  try {
    // Re-fetch the authenticated user so we can read the real `role` and
    // `category_id` from the DB (the JWT payload only carries { id, role }).
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Permission: category_admin may only create in their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only create courses in their own category.',
      });
    }

    // Confirm the target category exists.
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const course = await Course.create({
      category_id,
      title,
      description,
      created_by: currentUser.id,
    });

    return res.status(201).json({
      message: 'Course created successfully.',
      course,
    });
  } catch (error) {
    // Delegate to the centralized error handler in
    // src/middleware/errorHandler.js. Sequelize validation errors are
    // mapped to 400 there.
    next(error);
  }
};

// GET /api/courses?categoryId=<uuid>
// Lists courses belonging to a given category. Protected by `authenticate`;
// any authenticated role may access.
exports.getCoursesByCategory = async (req, res) => {
  const { categoryId } = req.query;

  if (!categoryId) {
    return res
      .status(400)
      .json({ error: 'categoryId query parameter is required.' });
  }

  try {
    const courses = await Course.findAll({
      where: { category_id: categoryId },
      include: [
        { model: Category, attributes: ['id', 'name'] },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.status(200).json({ courses });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/courses/:id
// Updates an existing course. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can update any course.
//  - category_admin: can update a course only when the course's existing
//    `category_id` matches their own. If the request also changes `category_id`,
//    the *new* value must still match their category (otherwise 403).
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description, category_id } = req.body;

  try {
    // Re-fetch the authenticated user for role / category_id.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Permission: category_admin may only act on courses in their own
    // category. If category_id is being changed, the new value is also
    // checked.
    if (currentUser.role === 'category_admin') {
      const effectiveCategoryId = category_id || course.category_id;
      if (currentUser.category_id !== effectiveCategoryId) {
        return res.status(403).json({
          error:
            'Category admin can only update courses in their own category.',
        });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;

    await course.update(updateData);

    return res.status(200).json({
      message: 'Course updated successfully.',
      course,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res
        .status(400)
        .json({ error: error.errors[0].message });
    }
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/courses/:id
// Deletes a course. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can delete any course.
//  - category_admin: can delete a course only when the course's
//    `category_id` matches their own. Otherwise 403.
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    // Re-fetch the authenticated user for role / category_id.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Permission: category_admin may only delete courses in their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== course.category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only delete courses in their own category.',
      });
    }

    await course.destroy();

    return res.status(200).json({
      message: 'Course deleted successfully.',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
