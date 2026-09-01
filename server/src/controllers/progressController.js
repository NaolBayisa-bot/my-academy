const { User, Enrollment, Lesson, LessonProgress, Module } = require('../models');

// POST /api/enrollments/:enrollmentId/lessons/:lessonId/complete
// Marks a lesson as complete for a given enrollment. Protected by
// `authenticate` + `authorize('student')`.
//
// Behavior:
//  - Verifies the enrollment belongs to the requesting student (403 otherwise).
//  - If a LessonProgress row already exists for this enrollment + lesson,
//    returns 200 (idempotent).
//  - Otherwise creates a LessonProgress row (completed_at defaults to now).
//  - After creating, checks if the count of completed lessons equals the
//    total lesson count for the course. If so, auto-completes the enrollment
//    by setting status to 'completed' and completed_at to now.
exports.markLessonComplete = async (req, res) => {
  const { enrollmentId, lessonId } = req.params;

  try {
    // Re-fetch the authenticated user so we can verify ownership.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Verify the enrollment belongs to the requesting student.
    if (enrollment.student_id !== currentUser.id) {
      return res.status(403).json({
        error: 'This enrollment does not belong to you.',
      });
    }

    // Idempotency: check if the lesson is already marked as complete for this
    // enrollment.
    const existingProgress = await LessonProgress.findOne({
      where: { enrollment_id: enrollmentId, lesson_id: lessonId },
    });
    if (existingProgress) {
      return res.status(200).json({
        message: 'Lesson already marked as complete.',
        lessonProgress: existingProgress,
      });
    }

    // Sequencing guard: a lesson may only be completed if it is the first
    // incomplete lesson in optional ("skip"/review) order. Lessons are ordered
    // by module.order_index then lesson.order_index (nulls last), matching the
    // order the curriculum is displayed to the student. This makes the
    // unlock-by-progress behavior enforceable server-side, not just cosmetic.
    const courseModules = await Module.findAll({
      where: { course_id: enrollment.course_id },
      order: [
        ['order_index', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      attributes: ['id', 'order_index'],
    });

    // Gather the lessons in the exact order they are shown to the student:
    // module order_index first, then each module's lessons by order_index.
    // Querying per module keeps the sequencing aligned with `getMyEnrollment`
    // rather than relying on UUID ordering of the lessons table.
    const orderedLessonIds = [];
    for (const mod of courseModules) {
      const moduleLessons = await Lesson.findAll({
        where: { module_id: mod.id },
        order: [
          ['order_index', 'ASC'],
          ['createdAt', 'ASC'],
        ],
        attributes: ['id'],
      });
      for (const lesson of moduleLessons) {
        orderedLessonIds.push(lesson.id);
      }
    }

    const completedRecords = await LessonProgress.findAll({
      where: { enrollment_id: enrollmentId },
      attributes: ['lesson_id'],
    });
    const completedLessonIdSet = new Set(
      completedRecords.map((r) => r.lesson_id)
    );

    // If we already completed everything, the sequencing guard is meaningless
    // (nothing left to unlock), but new submissions are still idempotent or a
    // 404; treat a completion beyond the set as allowed only when it is the
    // next in line.
    const nextLessonId =
      orderedLessonIds.find((id) => !completedLessonIdSet.has(id)) || null;
    if (nextLessonId && nextLessonId !== lessonId) {
      return res.status(403).json({
        error: 'Complete the previous lesson before moving on.',
      });
    }

    // Create the LessonProgress row.
    const lessonProgress = await LessonProgress.create({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
    });

    // Auto-completion: check if all lessons in the course have been completed.
    const totalLessons = await Lesson.count({
      include: [
        {
          model: Module,
          as: 'module',
          where: { course_id: enrollment.course_id },
        },
      ],
    });
    const completedLessons = await LessonProgress.count({
      where: { enrollment_id: enrollmentId },
    });

    if (completedLessons === totalLessons && totalLessons > 0) {
      await enrollment.update({
        status: 'completed',
        completed_at: new Date(),
      });
    }

    return res.status(201).json({
      message: 'Lesson marked as complete.',
      lessonProgress,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/enrollments/:enrollmentId/progress
// Returns the progress of a student for a given enrollment. Protected by
// `authenticate` + `authorize('student')`.
//
// Returns: { completedLessonIds, totalLessons, completedCount, percentage }
exports.getProgress = async (req, res) => {
  const { enrollmentId } = req.params;

  try {
    // Re-fetch the authenticated user so we can verify ownership.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Verify the enrollment belongs to the requesting student.
    if (enrollment.student_id !== currentUser.id) {
      return res.status(403).json({
        error: 'This enrollment does not belong to you.',
      });
    }

    // Count total lessons for the course (across all its modules).
    const totalLessons = await Lesson.count({
      include: [
        {
          model: Module,
          as: 'module',
          where: { course_id: enrollment.course_id },
        },
      ],
    });

    // Retrieve all completed lesson ids for this enrollment.
    const completedRecords = await LessonProgress.findAll({
      where: { enrollment_id: enrollmentId },
      attributes: ['lesson_id'],
    });
    const completedLessonIds = completedRecords.map((r) => r.lesson_id);

    // Calculate overall percentage.
    const percentage =
      totalLessons > 0
        ? Math.round((completedLessonIds.length / totalLessons) * 100)
        : 0;

    return res.status(200).json({
      completedLessonIds,
      totalLessons,
      completedCount: completedLessonIds.length,
      percentage,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
