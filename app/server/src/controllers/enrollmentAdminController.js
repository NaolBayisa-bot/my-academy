const { User, Category, Course, Enrollment, sequelize } = require('../models');

// GET /api/admin/enrollments/pending
// Returns all enrollments with status 'pending', scoped by the admin's role.
//
// Permission rules:
//  - super_admin: sees ALL pending enrollments. Optionally filter by
//    ?categoryId=<uuid> to narrow down to a specific category.
//  - category_admin: sees only pending enrollments whose course belongs to
//    their own category_id.
//
// Each result includes the student (User) and the course (Course) info.
exports.getPendingEnrollments = async (req, res) => {
  const { categoryId } = req.query;

  try {
    // Re-fetch the authenticated user to read the real role and category_id
    // (the JWT payload only carries { id, role }).
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // For category_admin, restrict to courses in their own category.
    // For super_admin with a ?categoryId= query param, restrict to that category.
    // Only add a where clause when there are actual conditions — passing an
    // empty where: {} on a Sequelize include can turn the LEFT JOIN into an
    // INNER JOIN with unexpected results.
    const courseInclude = {
      model: Course,
      attributes: ['id', 'title', 'category_id'],
    };
    if (currentUser.role === 'category_admin') {
      courseInclude.where = { category_id: currentUser.category_id };
    } else if (categoryId) {
      courseInclude.where = { category_id: categoryId };
    }

    const enrollments = await Enrollment.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        courseInclude,
      ],
      order: [['enrolled_at', 'DESC']],
    });

    return res.status(200).json({ enrollments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/admin/enrollments/:id/approve
// Approves a pending enrollment by setting status to 'in_progress'.
//
// Permission rules:
//  - only 'pending' enrollments can be approved.
//  - super_admin: can approve any pending enrollment.
//  - category_admin: can only approve if the enrollment's course belongs to
//    their own category_id.
exports.approveEnrollment = async (req, res) => {
  const { id } = req.params;

  // Validate UUID format — avoids PostgreSQL cast errors that would 500
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return res.status(400).json({ error: 'Invalid enrollment ID.' });
  }

  try {
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Only pending enrollments can be approved.
    if (enrollment.status !== 'pending') {
      return res.status(400).json({
        error: `Enrollment cannot be approved. Current status is '${enrollment.status}'.`,
      });
    }

    // Fetch the course to verify category scope for category_admin.
    const course = await Course.findByPk(enrollment.course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // category_admin may only approve enrollments in their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== course.category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only approve enrollments for courses in their own category.',
      });
    }

    // Approve: set status to 'in_progress' and clear any previous rejection reason.
    await enrollment.update({
      status: 'in_progress',
      reason: null,
    });

    return res.status(200).json({
      message: 'Enrollment approved successfully.',
      enrollment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/admin/enrollments/:id/reject
// Rejects a pending enrollment by setting status to 'rejected'.
// Accepts an optional `reason` field in the request body.
//
// Permission rules (same scope check as approveEnrollment):
//  - only 'pending' enrollments can be rejected.
//  - super_admin: can reject any pending enrollment.
//  - category_admin: can only reject if the enrollment's course belongs to
//    their own category_id.
exports.rejectEnrollment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Validate UUID format — avoids PostgreSQL cast errors that would 500
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return res.status(400).json({ error: 'Invalid enrollment ID.' });
  }

  try {
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Only pending enrollments can be rejected.
    if (enrollment.status !== 'pending') {
      return res.status(400).json({
        error: `Enrollment cannot be rejected. Current status is '${enrollment.status}'.`,
      });
    }

    // Fetch the course to verify category scope for category_admin.
    const course = await Course.findByPk(enrollment.course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // category_admin may only reject enrollments in their own category.
    if (
      currentUser.role === 'category_admin' &&
      currentUser.category_id !== course.category_id
    ) {
      return res.status(403).json({
        error:
          'Category admin can only reject enrollments for courses in their own category.',
      });
    }

    // Reject: set status to 'rejected' and store the optional reason.
    await enrollment.update({
      status: 'rejected',
      reason: reason || null,
    });

    return res.status(200).json({
      message: 'Enrollment rejected successfully.',
      enrollment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};