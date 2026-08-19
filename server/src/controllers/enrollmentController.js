const { User, Course, Enrollment } = require('../models');

// POST /api/enrollments
// Enrolls the authenticated student in a course. Protected by
// `authenticate` + `authorize('student')`.
//
// Validation rules:
//  - The target course must exist.
//  - The course's `category_id` must match the student's `category_id`.
//  - The student must not have any existing Enrollment with status
//    'pending' or 'in_progress' (the "locking" logic).
exports.enrollInCourse = async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required.' });
  }

  try {
    // Re-fetch the student so we read the real `category_id` from the DB
    // (the JWT payload only carries { id, role }).
    const student = await User.findByPk(req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Verify the course exists.
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Verify the course's category matches the student's selected category.
    if (course.category_id !== student.category_id) {
      return res
        .status(400)
        .json({ error: 'Course not in your selected category.' });
    }

        // Locking logic: a student may only have one pending or in_progress
    // enrollment at a time. This prevents them from stacking up multiple
    // enrollments while awaiting admin approval or while a course is underway.
    const activeEnrollment = await Enrollment.findOne({
      where: { student_id: student.id, status: ['pending', 'in_progress'] },
    });
    if (activeEnrollment) {
      return res.status(400).json({
        error:
          'You already have a pending or in-progress enrollment. Please wait for admin approval or finish your current course before enrolling in a new one.',
      });
    }

    // Create the enrollment with status 'pending' — it requires admin
    // approval before the student can access lessons.
    const enrollment = await Enrollment.create({
      student_id: student.id,
      course_id: courseId,
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Enrolled in course successfully.',
      enrollment,
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
