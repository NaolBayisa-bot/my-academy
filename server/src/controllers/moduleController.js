const { User, Course, Module, Lesson } = require('../models');

// Shared helper: loads the current user and the course, and enforces the
// same permission rules used across courses/lessons:
//  - super_admin: can act on any course.
//  - category_admin: can act only on courses in their own category.
// Returns { currentUser, course } or sends an error response and returns null.
async function authorizeCourseAccess(req, res, courseId) {
  const currentUser = await User.findByPk(req.user.id);
  if (!currentUser) {
    res.status(404).json({ error: 'User not found.' });
    return null;
  }

  const course = await Course.findByPk(courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return null;
  }

  if (
    currentUser.role === 'category_admin' &&
    currentUser.category_id !== course.category_id
  ) {
    res.status(403).json({
      error:
        'Category admin can only manage modules for courses in their own category.',
    });
    return null;
  }

  return { currentUser, course };
}

// POST /api/courses/:courseId/modules
// Creates a module in a specific course. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
exports.createModule = async (req, res, next) => {
  const { courseId } = req.params;
  const { title, description, order_index } = req.body;

  try {
    const access = await authorizeCourseAccess(req, res, courseId);
    if (!access) return undefined;

    const module = await Module.create({
      course_id: courseId,
      title,
      description,
      order_index,
    });

    return res.status(201).json({
      message: 'Module created successfully.',
      module,
    });
  } catch (error) {
    // Delegate to the centralized error handler. Sequelize validation errors
    // are mapped to 400 there.
    next(error);
  }
  return undefined;
};

// GET /api/courses/:courseId/modules
// Lists all modules of a course with their nested lessons (ordered). Any
// authenticated role may read; category_admin restricted to own category.
exports.getModulesByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    const access = await authorizeCourseAccess(req, res, courseId);
    if (!access) return undefined;

    const modules = await Module.findAll({
      where: { course_id: courseId },
      order: [
        ['order_index', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      include: [
        {
          model: Lesson,
          as: 'lessons',
          separate: true,
          order: [['order_index', 'ASC']],
        },
      ],
    });

    return res.status(200).json({ modules });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/modules/:id
// Updates an existing module. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
exports.updateModule = async (req, res) => {
  const { id } = req.params;
  const { title, description, order_index, course_id } = req.body;

  try {
    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const access = await authorizeCourseAccess(req, res, module.course_id);
    if (!access) return undefined;

    // If moving to another course, verify permission on the new course too.
    if (course_id !== undefined && course_id !== module.course_id) {
      const newAccess = await authorizeCourseAccess(req, res, course_id);
      if (!newAccess) return undefined;
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (course_id !== undefined) updateData.course_id = course_id;

    await module.update(updateData);

    return res.status(200).json({
      message: 'Module updated successfully.',
      module,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/modules/:id
// Deletes a module (and its lessons via FK cascade). Protected by
// `authenticate` + `authorize('super_admin', 'category_admin')`.
exports.deleteModule = async (req, res) => {
  const { id } = req.params;

  try {
    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const access = await authorizeCourseAccess(req, res, module.course_id);
    if (!access) return undefined;

    await module.destroy();

    return res.status(200).json({
      message: 'Module deleted successfully.',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
