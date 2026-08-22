const { User, Category, Enrollment, Course, Lesson, LessonProgress } = require('../models');

// Strip sensitive fields from a user instance before sending it in a response.
const serializeUser = (user) => {
  const { password_hash, ...publicFields } = user.toJSON();
  return publicFields;
};

// POST /api/students/select-category
// Lets a student select (and set) their category of interest. Protected by
// `authenticate` + `authorize('student')`.
//
// Rules:
//  - The target category must exist.
//  - If the student already has a `category_id` AND has any Enrollment with
//    status 'in_progress', the request is rejected with 400. (If the student
//    has a category_id but no in_progress enrollment, they may change it.)
//  - If the student does not yet have a `category_id`, the selection proceeds
//    normally.
exports.selectCategory = async (req, res) => {
  const { categoryId } = req.body;

  if (!categoryId) {
    return res
      .status(400)
      .json({ error: 'categoryId is required.' });
  }

  try {
    // Re-fetch the user so we read the latest `category_id` straight from the DB
    // (the JWT payload on req.user only carries { id, role }).
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

        // If the student already has a category selected, they may only change it
    // when they have no pending or in-progress enrollment.
    if (user.category_id) {
      const activeEnrollment = await Enrollment.findOne({
        where: { student_id: user.id, status: ['pending', 'in_progress'] },
      });
      if (activeEnrollment) {
        return res.status(400).json({
          error:
            'Cannot change category while you have a pending or in-progress enrollment. Complete or withdraw your current enrollment first.',
        });
      }
    }

    // Validate categoryId
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await user.update({ category_id: categoryId });

    return res.status(200).json({
      message: 'Category selected successfully.',
      user: serializeUser(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/students/my-category-courses
// Returns all courses in the student's own category. Protected by
// `authenticate` + `authorize('student')`.
exports.getMyCategoryCourses = async (req, res) => {
  try {
    // Re-fetch the student to read the latest `category_id`.
    const student = await User.findByPk(req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (!student.category_id) {
      return res.status(400).json({
        error: 'Select a category before browsing courses.',
      });
    }

    const courses = await Course.findAll({
      where: { category_id: student.category_id },
    });

    return res.status(200).json({ courses });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/students/my-enrollment
// Returns the student's current in_progress enrollment (with the course,
// its lessons, and the student's lesson progress), or null if none.
// Protected by `authenticate` + `authorize('student')`.
exports.getMyEnrollment = async (req, res) => {
  try {
    // Re-fetch the student to read the latest `category_id`.
    const student = await User.findByPk(req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const enrollment = await Enrollment.findOne({
      where: { student_id: student.id, status: 'in_progress' },
      include: [
        {
          model: Course,
          attributes: ['id', 'title', 'description', 'category_id'],
          include: [
            {
              model: Lesson,
              attributes: ['id', 'title', 'type', 'url', 'order_index'],
            },
          ],
        },
        {
          model: LessonProgress,
          attributes: ['lesson_id', 'completed_at'],
        },
      ],
    });

    if (!enrollment) {
      return res.status(200).json({ enrollment: null });
    }

    return res.status(200).json({ enrollment });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/students/my-history
// Returns all of the student's past completed enrollments (with course info).
// Protected by `authenticate` + `authorize('student')`.
exports.getMyHistory = async (req, res) => {
  try {
    // Re-fetch the student to read the latest `category_id`.
    const student = await User.findByPk(req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const enrollments = await Enrollment.findAll({
      where: { student_id: student.id, status: 'completed' },
      include: [
        {
          model: Course,
          attributes: ['id', 'title', 'description', 'category_id'],
        },
      ],
      order: [['completed_at', 'DESC']],
    });

    return res.status(200).json({ enrollments });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
