const { User, Category, Enrollment, Course, Module, Lesson, LessonProgress, sequelize } = require('../models');
const { Op } = require('sequelize');

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

    // Exclude courses the student is already enrolled in (any status —
    // pending, in_progress, or completed) so that the "Available" count
    // reflects only courses they can actually enroll in.
    const enrolledCourseIds = await Enrollment.findAll({
      where: { student_id: student.id },
      attributes: ['course_id'],
    }).then((rows) => rows.map((row) => row.course_id));

    const courses = await Course.findAll({
      where: {
        category_id: student.category_id,
        ...(enrolledCourseIds.length > 0 && {
          id: { [Op.notIn]: enrolledCourseIds },
        }),
      },
    });

    // Per-course lesson count, summed across that course's modules. Two small
    // grouped queries (modules, then lessons by module) — no N+1 per course.
    const courseIds = courses.map((c) => c.id);
    const lessonCounts = {};
    if (courseIds.length) {
      const modules = await Module.findAll({
        where: { course_id: courseIds },
        attributes: ['id', 'course_id'],
      });
      const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));
      const moduleIds = modules.map((m) => m.id);
      if (moduleIds.length) {
        const lessonRows = await Lesson.findAll({
          where: { module_id: moduleIds },
          attributes: [
            'module_id',
            [sequelize.fn('COUNT', sequelize.col('module_id')), 'count'],
          ],
          group: ['module_id'],
        });
        for (const row of lessonRows) {
          const courseId = moduleToCourse.get(row.module_id);
          lessonCounts[courseId] =
            (lessonCounts[courseId] || 0) + Number(row.get('count'));
        }
      }
    }

    return res
      .status(200)
      .json({
        courses: courses.map((c) => ({ ...c.toJSON(), lessonsCount: lessonCounts[c.id] || 0 })),
      });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/students/my-enrollment
// Returns the student's most recent enrollment (with the course, its lessons,
// and the student's lesson progress), or null if the student has never
// enrolled. The row may be pending, in_progress, or completed — callers should
// interpret `enrollment.status` to decide how to render it.
// Protected by `authenticate` + `authorize('student')`.
exports.getMyEnrollment = async (req, res) => {
  try {
    // Re-fetch the student to read the latest `category_id`.
    const student = await User.findByPk(req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const enrollment = await Enrollment.findOne({
      where: { student_id: student.id },
      // Stable include aliases so the response shape is predictable:
      // enrollment.course.title, enrollment.course.modules[].lessons[],
      // enrollment.lessonProgresses[].
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'description', 'category_id'],
          include: [
            {
              model: Module,
              as: 'modules',
              attributes: ['id', 'title', 'description', 'order_index'],
              separate: true,
              order: [['order_index', 'ASC']],
              include: [
                {
                  model: Lesson,
                  as: 'lessons',
                  attributes: ['id', 'title', 'type', 'url', 'content', 'order_index'],
                  separate: true,
                  order: [['order_index', 'ASC']],
                },
              ],
            },
          ],
        },
        {
          model: LessonProgress,
          as: 'lessonProgresses',
          attributes: ['lesson_id', 'completed_at'],
        },
      ],
      order: [['enrolled_at', 'DESC']],
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
      // Stable include aliases so each enrollment is shaped as
      // enrollment.course.title / enrollment.course.category.name.
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'description', 'category_id'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['completed_at', 'DESC']],
    });

    // Per-course lesson count for the history cards ("🎓 X lessons"). Uses the
    // same joined Module->Lesson count as the catalog endpoint, minus N+1.
    const courses = enrollments.map((e) => e.course).filter(Boolean);
    const courseIds = courses.map((c) => c.id);
    const lessonCounts = {};
    if (courseIds.length) {
      const modules = await Module.findAll({
        where: { course_id: courseIds },
        attributes: ['id', 'course_id'],
      });
      const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));
      const moduleIds = modules.map((m) => m.id);
      if (moduleIds.length) {
        const lessonRows = await Lesson.findAll({
          where: { module_id: moduleIds },
          attributes: [
            'module_id',
            [sequelize.fn('COUNT', sequelize.col('module_id')), 'count'],
          ],
          group: ['module_id'],
        });
        for (const row of lessonRows) {
          const courseId = moduleToCourse.get(row.module_id);
          lessonCounts[courseId] =
            (lessonCounts[courseId] || 0) + Number(row.get('count'));
        }
      }
    }

    // Shape output: normalize the nested course key and attach lessonsCount.
    const shaped = enrollments.map((e) => {
      const course = e.course || e.Course || null;
      return {
        id: e.id,
        enrolled_at: e.enrolled_at,
        completed_at: e.completed_at,
        course: course
          ? {
              id: course.id,
              title: course.title,
              description: course.description,
              category: course.category
                ? { id: course.category.id, name: course.category.name }
                : null,
              lessonsCount: lessonCounts[course.id] || 0,
            }
          : null,
      };
    });

    return res.status(200).json({ enrollments: shaped });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
