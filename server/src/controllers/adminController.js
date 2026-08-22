const { User, Category, Course, Enrollment, Lesson, LessonProgress, Post, sequelize } = require('../models');

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

    // Number of accounts currently suspended (kept on file, not deleted).
    const suspendedStudents = await User.count({
      where: { role: 'student', status: 'suspended' },
    });

    // Number of students with at least one rejected enrollment.
    // A student may reappear after approval, so we count by enrollment status.
    const rejectedStudents = await Enrollment.count({
      distinct: true,
      where: { status: 'rejected' },
      col: 'student_id',
    });

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
      suspendedStudents,
      rejectedStudents,
      completionsPerCategory,
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
// UUID format used to validate :id params before querying (avoids PG cast errors).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /api/admin/users/:id/suspend
// Soft-deactivates a user: sets `status` to 'suspended' so they are blocked from
// the platform (login + every authenticated request) but ALL of their data is
// preserved, making the change fully reversible via activateUser. Protected by
// `authenticate` + `authorize('super_admin')`.
exports.suspendUser = async (req, res) => {
  const { id } = req.params;

  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const target = await User.findByPk(id);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot suspend yourself.' });
    }
    if (target.role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot suspend a super admin.' });
    }
    if (target.status === 'suspended') {
      return res.status(400).json({ error: 'User is already suspended.' });
    }

    await target.update({ status: 'suspended' });

    return res.status(200).json({
      message: 'User suspended. Their data is preserved and can be restored.',
      user: serializeUser(target),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/admin/users/:id/activate
// Reverses a suspension: restores the user to `status = 'active'` with their
// original data intact. Protected by `authenticate` + `authorize('super_admin')`.
exports.activateUser = async (req, res) => {
  const { id } = req.params;

  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const target = await User.findByPk(id);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (target.role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot activate a super admin.' });
    }
    if (target.status !== 'suspended') {
      return res.status(400).json({ error: 'User is not suspended.' });
    }

    await target.update({ status: 'active' });

    return res.status(200).json({
      message: 'User activated. They can log in again.',
      user: serializeUser(target),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/admin/users/:id
// Permanently removes a user (and every piece of data that depends on them),
// because the models define no delete-cascades in the database. Destructive and
// irreversible. Protected by `authenticate` + `authorize('super_admin')`.
//
// Within a single transaction:
//  1. If the user is a category's admin, that category's admin_id is cleared.
//  2. The user's lesson progress (via their own enrollments) is deleted.
//  3. The user's enrollments are deleted.
//  4. The user's posts are deleted.
//  5. Courses the user created are deleted, along with their nested lessons,
//     enrollments, and those enrollments' progress — so nothing is left orphaned.
//  6. The user row itself is deleted.
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const target = await User.findByPk(id);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    if (target.role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot delete a super admin.' });
    }

    await sequelize.transaction(async (t) => {
      // 1. Revoke any category-admin assignment.
      const administeredCategory = await Category.findOne({ where: { admin_id: id } });
      if (administeredCategory) {
        await administeredCategory.update({ admin_id: null }, { transaction: t });
      }

      // 2. Delete the user's own lesson progress (their enrollments first).
      const ownEnrollments = await Enrollment.findAll({
        where: { student_id: id },
        attributes: ['id'],
      });
      const ownEnrollmentIds = ownEnrollments.map((e) => e.id);
      if (ownEnrollmentIds.length > 0) {
        await LessonProgress.destroy({
          where: { enrollment_id: ownEnrollmentIds },
          transaction: t,
        });
      }

      // 3. Delete the user's enrollments.
      await Enrollment.destroy({ where: { student_id: id }, transaction: t });

      // 4. Delete the user's posts.
      await Post.destroy({ where: { author_id: id }, transaction: t });

      // 5. Delete the courses the user created and their nested data.
      const createdCourses = await Course.findAll({
        where: { created_by: id },
        attributes: ['id'],
      });
      for (const course of createdCourses) {
        const courseEnrollments = await Enrollment.findAll({
          where: { course_id: course.id },
          attributes: ['id'],
        });
        const courseEnrollmentIds = courseEnrollments.map((e) => e.id);
        if (courseEnrollmentIds.length > 0) {
          await LessonProgress.destroy({
            where: { enrollment_id: courseEnrollmentIds },
            transaction: t,
          });
        }
        await Enrollment.destroy({ where: { course_id: course.id }, transaction: t });
        await Lesson.destroy({ where: { course_id: course.id }, transaction: t });
        await course.destroy({ transaction: t });
      }

      // 6. Delete the user row last.
      await target.destroy({ transaction: t });
        });

    return res.status(200).json({ message: 'User permanently deleted.' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
