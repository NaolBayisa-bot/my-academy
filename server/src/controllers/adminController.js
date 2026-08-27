const { User, Category, Course, Enrollment, Lesson, LessonProgress, Module, Post, sequelize } = require('../models');

// Strip sensitive fields from a user instance before sending it in a response.
const serializeUser = (user) => {
  const { password_hash, ...publicFields } = user.toJSON();
  return publicFields;
};

// Shapes a student (already loaded with enrollments and their course) for API
// output:
//  - strips password_hash (via serializeUser)
//  - keeps the full `enrollments` array (backward compatible)
//  - adds `currentEnrollment`: the most recent enrollment by `enrolled_at`,
//    or null when the student has no enrollment yet.
const serializeStudent = (student) => {
  const publicStudent = serializeUser(student);

  // Sequelize attaches the nested Course on each enrollment under the key
  // `Course` (capital "C") because the Enrollment->Course association has no
  // alias. Normalize every enrollment to a lowercase `course` key so the shape
  // is consistent for both the `enrollments` array and `currentEnrollment`.
  const enrollments = (publicStudent.enrollments || []).slice().map((enrollment) => {
    const { Course, ...rest } = enrollment;
    return { ...rest, course: Course || null };
  });

  // `currentEnrollment` is the most recent enrollment (by `enrolled_at`), or
  // null when the student has none. It references the same normalized objects.
  const currentEnrollment = enrollments.reduce((latest, enrollment) => {
    if (!latest) return enrollment;
    return new Date(enrollment.enrolled_at) >= new Date(latest.enrolled_at)
      ? enrollment
      : latest;
  }, null);

  return {
    ...publicStudent,
    enrollments,
    currentEnrollment,
  };
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
              as: 'course',
              attributes: ['id', 'title'],
            },
          ],
        },
      ],
    });

    // Shape each student: strip password_hash and attach their current
    // (most recent) enrollment — or null if they have none.
    const serialized = students.map(serializeStudent);

    return res.status(200).json({ students: serialized });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/admin/students
// Returns every student across all categories, grouped by their category_id.
// Super_admin only (enforced both at the route and defensively here).
//
// Response shape:
//   { studentsByCategory: { "<categoryId>": [student, ...], ... } }
// Students with no category (category_id null) are grouped under the nil UUID
// '00000000-0000-0000-0000-000000000000'. Each student is shaped identically
// to the per-category endpoint (serialized, with currentEnrollment + course).
exports.getAllStudents = async (req, res) => {
  // Students with no category are grouped under this nil UUID key.
  const NULL_CATEGORY_ID = '00000000-0000-0000-0000-000000000000';

  try {
    // Re-fetch the authenticated user — the JWT payload only carries { id, role }.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Defensive guard: the route already restricts this to super_admin.
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: insufficient role.' });
    }

    // Fetch every student (regardless of category) with their enrollments and
    // the associated course, so each can be shaped identically to the per-category
    // endpoint. Order by category_id so groups land contiguously.
    const students = await User.findAll({
      where: { role: 'student' },
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          attributes: ['id', 'course_id', 'status', 'enrolled_at', 'completed_at'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title'],
            },
          ],
        },
      ],
      order: [['category_id', 'ASC']],
    });

    const studentsByCategory = {};

    students.forEach((student) => {
      const groupId = student.category_id || NULL_CATEGORY_ID;
      if (!studentsByCategory[groupId]) {
        studentsByCategory[groupId] = [];
      }
      studentsByCategory[groupId].push(serializeStudent(student));
    });

    return res.status(200).json({ studentsByCategory });
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
    const totalAdmins = await User.count({ where: { role: 'category_admin' } });
    const totalLessons = await Lesson.count();

    // Completions per category + students per category: iterate over all
    // categories once and gather both metrics in the same pass.
    const categories = await Category.findAll({
      attributes: ['id', 'name'],
    });

    const completionsPerCategory = [];
    const studentsPerCategory = [];
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

      const students = await User.count({
        where: { role: 'student', category_id: category.id },
      });
      studentsPerCategory.push({
        category_id: category.id,
        name: category.name,
        students,
      });
    }

    // Global enrollment status distribution.
    const statusRows = await Enrollment.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
      ],
      group: ['status'],
    });
    const enrollmentsByStatus = { pending: 0, in_progress: 0, completed: 0, rejected: 0 };
    let totalEnrollments = 0;
    statusRows.forEach((r) => {
      const count = Number(r.get('count'));
      totalEnrollments += count;
      if (enrollmentsByStatus[r.status] !== undefined) {
        enrollmentsByStatus[r.status] = count;
      }
    });
    const completionRate = totalEnrollments
      ? Math.round((enrollmentsByStatus.completed / totalEnrollments) * 100)
      : 0;

    // Platform content totals.
    const totalPosts = await Post.count();

    // Latest signups (students) as recent activity.
    const recentStudents = await User.findAll({
      where: { role: 'student' },
      order: [['createdAt', 'DESC']],
      limit: 6,
      attributes: ['id', 'name', 'email', 'createdAt'],
      include: [{ model: Category, attributes: ['name'] }],
    });

    return res.status(200).json({
      totalStudents,
      totalCourses,
      totalAdmins,
      totalLessons,
      totalPosts,
      totalEnrollments,
      completionRate,
      enrollmentsByStatus,
      completionsPerCategory,
      studentsPerCategory,
      recentStudents: recentStudents.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        joined_at: u.createdAt,
        category: u.Category ? u.Category.name : null,
      })),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
// PATCH /api/admin/deassign-category-admin
// Inverse of assign-category-admin: clears `category.admin_id` and reverts the
// de-assigned user's role back to 'student', both within a transaction. Protected
// by `authenticate` + `authorize('super_admin')`.
//
// The user's `category_id` is intentionally left untouched so the de-assigned
// user stays grouped under their category and is immediately available again from
// that category's student picker (GET /api/admin/students is scoped per category
// and excludes non-student roles). `assignCategoryAdmin` sets category_id when
// promoting to admin, so leaving it makes the user reappear in the same
// category's pool after being de-assigned.
exports.deassignCategoryAdmin = async (req, res) => {
  const { categoryId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ error: 'categoryId is required.' });
  }

  try {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (!category.admin_id) {
      return res
        .status(400)
        .json({ error: 'Category has no admin assigned.' });
    }

    const user = await User.findByPk(category.admin_id);

    await sequelize.transaction(async (t) => {
      await category.update({ admin_id: null }, { transaction: t });
      if (user) {
        await user.update({ role: 'student' }, { transaction: t });
      }
    });

    return res.status(200).json({
      message: 'Category admin de-assigned.',
      category: {
        id: category.id,
        name: category.name,
        admin_id: null,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/admin/students/:id/suspend
// Suspends a student by setting suspended=true.
// Only super_admin can perform this action.
exports.suspendStudent = async (req, res) => {
  const { id } = req.params;

  // Validate UUID format
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return res.status(400).json({ error: 'Invalid student ID.' });
  }

  try {
    // Double-check the user is a super_admin
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: insufficient role.' });
    }

    const student = await User.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (student.role !== 'student') {
      return res
        .status(400)
        .json({ error: 'This user is not a student and cannot be suspended.' });
    }

    if (student.suspended) {
      return res
        .status(400)
        .json({ error: 'Student is already suspended.' });
    }

    await student.update({ suspended: true });

    return res.status(200).json({
      message: 'Student suspended successfully.',
      student: serializeUser(student),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/admin/students/:id/unsuspend
// Unsuspends a student by setting suspended=false.
// Only super_admin can perform this action.
exports.unsuspendStudent = async (req, res) => {
  const { id } = req.params;

  // Validate UUID format
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return res.status(400).json({ error: 'Invalid student ID.' });
  }

  try {
    // Double-check the user is a super_admin
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: insufficient role.' });
    }

    const student = await User.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (student.role !== 'student') {
      return res
        .status(400)
        .json({ error: 'This user is not a student.' });
    }

    if (!student.suspended) {
      return res
        .status(400)
        .json({ error: 'Student is not suspended.' });
    }

    await student.update({ suspended: false });

    return res.status(200).json({
      message: 'Student unsuspended successfully.',
      student: serializeUser(student),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/admin/students/:id
// Permanently deletes a student and all their associated data.
// Only super_admin can perform this action.
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;

  // Validate UUID format
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return res.status(400).json({ error: 'Invalid student ID.' });
  }

  try {
    // Double-check the user is a super_admin
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: insufficient role.' });
    }

    const student = await User.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (student.role !== 'student') {
      return res
        .status(400)
        .json({ error: 'This user is not a student.' });
    }

    // Delete all associated records in a transaction
    // Order matters: LessonProgress -> Enrollment -> Student
    await sequelize.transaction(async (t) => {
      // Delete all lesson progress records for this student's enrollments
      const enrollments = await Enrollment.findAll({
        where: { student_id: student.id },
        transaction: t,
      });

      const enrollmentIds = enrollments.map((e) => e.id);
      if (enrollmentIds.length > 0) {
        await LessonProgress.destroy({
          where: { enrollment_id: enrollmentIds },
          transaction: t,
        });
      }

      // Delete all enrollments for this student
      await Enrollment.destroy({
        where: { student_id: student.id },
        transaction: t,
      });

      // Delete the student
      await student.destroy({ transaction: t });
    });

    return res.status(200).json({
      message: 'Student deleted successfully.',
      deletedStudentId: student.id,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/admin/category-stats
// Statistical summary for the admin dashboard. Scoped to the caller's own
// category (category_admin); a super_admin without a category gets global
// numbers. Returns counts, status distribution, completion rate, per-course
// enrollment breakdown and the latest enrollments as recent activity.
exports.getCategoryStats = async (req, res) => {
  try {
    // The JWT only carries { id, role }, so resolve the caller's category
    // from the database rather than trusting the token payload.
    const currentUser = await User.findByPk(req.user.id, {
      attributes: ['id', 'category_id'],
    });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const categoryId = currentUser.category_id || null;
    const whereCourse = categoryId ? { category_id: categoryId } : {};
    const courses = await Course.findAll({
      where: whereCourse,
      attributes: ['id', 'title'],
    });
    const courseIds = courses.map((c) => c.id);

    const totalStudents = await User.count(
      categoryId ? { where: { role: 'student', category_id: categoryId } } : { where: { role: 'student' } }
    );
    const totalCourses = courses.length;
    const totalLessons = courseIds.length
      ? await Lesson.count({
          // Lessons belong to Modules (not directly to Courses) after the
          // Course -> Module -> Lesson refactor, so count via the association.
          include: [
            {
              model: Module,
              as: 'module',
              where: { course_id: courseIds },
            },
          ],
        })
      : 0;

    const enrollments = courseIds.length
      ? await Enrollment.findAll({ where: { course_id: courseIds }, attributes: ['status'] })
      : [];
    const byStatus = { pending: 0, in_progress: 0, completed: 0, rejected: 0 };
    enrollments.forEach((e) => {
      if (byStatus[e.status] !== undefined) byStatus[e.status] += 1;
    });
    const totalEnrollments = enrollments.length;
    const completionRate = totalEnrollments
      ? Math.round((byStatus.completed / totalEnrollments) * 100)
      : 0;

    // Per-course enrollment distribution (top courses by enrollment count).
    const perCourseRows = courseIds.length
      ? await Enrollment.findAll({
          where: { course_id: courseIds },
          attributes: [
            'course_id',
            [sequelize.fn('COUNT', sequelize.col('course_id')), 'count'],
          ],
          group: ['course_id'],
        })
      : [];
    const countByCourse = new Map(
      perCourseRows.map((r) => [r.course_id, Number(r.get('count'))])
    );
    const perCourse = courses
      .map((c) => ({ title: c.title, enrollments: countByCourse.get(c.id) || 0 }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    const recentEnrollments = courseIds.length
      ? await Enrollment.findAll({
          where: { course_id: courseIds },
          order: [['enrolled_at', 'DESC']],
          limit: 6,
          include: [
            { model: User, as: 'student', attributes: ['name', 'email'] },
            { model: Course, as: 'course', attributes: ['title'] },
          ],
        })
      : [];

    const totalPosts = await Post.count(
      categoryId ? { where: { category_id: categoryId } } : {}
    );

    return res.status(200).json({
      stats: {
        scope: categoryId ? 'category' : 'global',
        totalStudents,
        totalCourses,
        totalLessons,
        totalPosts,
        enrollments: {
          total: totalEnrollments,
          ...byStatus,
          completionRate,
        },
        perCourse,
        recentEnrollments: recentEnrollments.map((e) => ({
          id: e.id,
          status: e.status,
          enrolled_at: e.enrolled_at,
          student: e.student ? { name: e.student.name, email: e.student.email } : null,
          // Enrollment->Course has no alias, so Sequelize nests it as `Course`.
          course: (e.course || e.Course) ? { title: (e.course || e.Course).title } : null,
        })),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
