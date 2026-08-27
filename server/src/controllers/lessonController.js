const { User, Course, Module, Lesson } = require('../models');

// Shared helper: loads the current user and the course that owns the given
// module, and enforces the same permission rules used across courses/lessons:
//  - super_admin: can act on any course.
//  - category_admin: can act only on courses in their own category.
// Returns { currentUser, course } or sends an error response and returns null.
async function authorizeModuleAccess(req, res, moduleId) {
  const currentUser = await User.findByPk(req.user.id);
  if (!currentUser) {
    res.status(404).json({ error: 'User not found.' });
    return null;
  }

  const module = await Module.findByPk(moduleId);
  if (!module) {
    res.status(404).json({ error: 'Module not found.' });
    return null;
  }

  const course = await Course.findByPk(module.course_id);
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
        'Category admin can only manage lessons for courses in their own category.',
    });
    return null;
  }

  return { currentUser, module, course };
}

// POST /api/courses/:courseId/modules/:moduleId/lessons
// Creates a lesson inside a specific module of a specific course. Protected by
// `authenticate` + `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can create lessons for any course/module.
//  - category_admin: can create lessons only for courses whose
//    `category_id` matches their own. A mismatch yields 403.
exports.createLesson = async (req, res, next) => {
  const { courseId, moduleId } = req.params;
  const { title, type, url, order_index, content } = req.body;

  try {
    // Re-fetch the authenticated user so we can read the real `role` and
    // `category_id` from the DB (the JWT payload only carries { id, role }).
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Confirm the target course exists.
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Permission: category_admin may only create lessons for courses in
    // their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== course.category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only create lessons for courses in their own category.',
      });
    }

    // Confirm the target module exists and belongs to this course.
    const module = await Module.findByPk(moduleId);
    if (!module || module.course_id !== courseId) {
      return res
        .status(404)
        .json({ error: 'Module not found for this course.' });
    }

    const lesson = await Lesson.create({
      module_id: moduleId,
      title,
      type,
      url,
      order_index,
      // Optional lesson notes / examples (empty -> NULL).
      content:
        typeof content === 'string' && content.trim() !== ''
          ? content
          : null,
    });

    return res.status(201).json({
      message: 'Lesson created successfully.',
      lesson,
    });
  } catch (error) {
    // Delegate to the centralized error handler in
    // src/middleware/errorHandler.js. Sequelize validation errors are
    // mapped to 400 there.
    next(error);
  }
};

// GET /api/courses/:courseId/lessons
// Lists all lessons belonging to a course (across all of its modules).
// Protected by `authenticate` + `authorize('super_admin', 'category_admin')`.
// For a module-grouped view, use GET /api/courses/:courseId/modules instead.
exports.getLessonsByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    // Re-fetch the authenticated user for role / category_id.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Permission: category_admin may only access courses in their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== course.category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only access courses in their own category.',
      });
    }

    const lessons = await Lesson.findAll({
      include: [
        {
          model: Module,
          as: 'module',
          where: { course_id: courseId },
          attributes: ['id', 'title', 'order_index'],
        },
      ],
      order: [['order_index', 'ASC']],
    });

    return res.status(200).json({ lessons });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/lessons/:id
// Updates an existing lesson. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can update any lesson.
//  - category_admin: can update a lesson only when the lesson's course
//    `category_id` matches their own. If `module_id` is being changed in
//    the body, the *new* module's course category must also match (403).
exports.updateLesson = async (req, res) => {
  const { id } = req.params;
  const { title, type, url, order_index, module_id, content } = req.body;

  try {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    // Permission check on the lesson's current module (loads user + course).
    const access = await authorizeModuleAccess(req, res, lesson.module_id);
    if (!access) return undefined;

    // If module_id is being changed, verify the new module exists and belongs
    if (module_id !== undefined && module_id !== lesson.module_id) {
      const newAccess = await authorizeModuleAccess(req, res, module_id);
      if (!newAccess) return undefined;
    }

    // Partial update: only apply fields present in the request body.
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (url !== undefined) updateData.url = url;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (module_id !== undefined) updateData.module_id = module_id;
    if (content !== undefined) {
      updateData.content =
        typeof content === 'string' && content.trim() !== '' ? content : null;
    }

    await lesson.update(updateData);

    return res.status(200).json({
      message: 'Lesson updated successfully.',
      lesson,
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

// DELETE /api/lessons/:id
// Deletes a lesson. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can delete any lesson.
//  - category_admin: can delete a lesson only when the lesson's course
//    `category_id` matches their own. Otherwise 403.
exports.deleteLesson = async (req, res) => {
  const { id } = req.params;

  try {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    // Permission check via the lesson's module -> course (loads user too).
    const access = await authorizeModuleAccess(req, res, lesson.module_id);
    if (!access) return undefined;

    await lesson.destroy();

    return res.status(200).json({
      message: 'Lesson deleted successfully.',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
