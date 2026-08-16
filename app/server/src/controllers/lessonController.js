const { User, Course, Lesson } = require('../models');

// POST /api/courses/:courseId/lessons
// Creates a lesson in a specific course. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - super_admin: can create lessons for any course.
//  - category_admin: can create lessons only for courses whose
//    `category_id` matches their own. A mismatch yields 403.
//
// The `course_id` is always taken from the URL (req.params.courseId),
// never from the request body, to prevent spoofing.
exports.createLesson = async (req, res, next) => {
  const { courseId } = req.params;
  const { title, type, url, order_index } = req.body;

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

    const lesson = await Lesson.create({
      course_id: courseId,
      title,
      type,
      url,
      order_index,
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
// Lists lessons belonging to a course. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
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
      where: { course_id: courseId },
      order: [['order_index', 'ASC']],
      include: [
        { model: Course, attributes: ['id', 'title', 'category_id'] },
      ],
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
//    `category_id` matches their own. If `course_id` is being changed in
//    the body, the *new* course's category must also match (otherwise 403).
exports.updateLesson = async (req, res) => {
  const { id } = req.params;
  const { title, type, url, order_index, course_id } = req.body;

  try {
    // Re-fetch the authenticated user for role / category_id.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    // Fetch the course the lesson currently belongs to.
    const course = await Course.findByPk(lesson.course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Permission: category_admin may only act on courses in their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== course.category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only update lessons for courses in their own category.',
      });
    }

    // If course_id is being changed, verify the new course is also within
    // the category_admin's category (if applicable).
    if (course_id !== undefined && course_id !== lesson.course_id) {
      const newCourse = await Course.findByPk(course_id);
      if (!newCourse) {
        return res.status(404).json({ error: 'Course not found.' });
      }
      if (
        currentUser.role === 'category_admin' &&
        currentUser.category_id !== newCourse.category_id
      ) {
        return res.status(403).json({
          error:
            'Category admin can only update lessons for courses in their own category.',
        });
      }
    }

    // Partial update: only apply fields present in the request body.
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (url !== undefined) updateData.url = url;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (course_id !== undefined) updateData.course_id = course_id;

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
    // Re-fetch the authenticated user for role / category_id.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    // Fetch the course the lesson belongs to.
    const course = await Course.findByPk(lesson.course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Permission: category_admin may only delete lessons for courses in
    // their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== course.category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only delete lessons for courses in their own category.',
      });
    }

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
