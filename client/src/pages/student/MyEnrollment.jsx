import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

function MyEnrollment() {
  const [enrollment, setEnrollment] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingId, setCompletingId] = useState(null)

  const loadEnrollment = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const res = await api.get('/students/my-enrollment')
      setEnrollment(res.data.enrollment)
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to load your enrollment. Please try again.'
      )
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadEnrollment(true)
  }, [])

  // When the enrollment is in progress, load its progress summary. Re-runs
  // whenever a new enrollment object arrives (e.g. after a lesson is marked
  // complete) so the bar/checkboxes stay in sync.
  useEffect(() => {
    if (enrollment && enrollment.status === 'in_progress') {
      api
        .get(`/enrollments/${enrollment.id}/progress`)
        .then((res) => setProgress(res.data))
        .catch((err) =>
          setError(
            err.response?.data?.error || 'Failed to load progress. Please try again.'
          )
        )
    } else {
      setProgress(null)
    }
  }, [enrollment])

  const handleComplete = async (lessonId) => {
    setCompletingId(lessonId)
    setError(null)
    try {
      await api.post(
        `/enrollments/${enrollment.id}/lessons/${lessonId}/complete`
      )
      // Refresh the enrollment; the effect above reloads progress and the UI
      // flips to "completed" if this was the last lesson.
      await loadEnrollment()
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to mark lesson complete. Please try again.'
      )
    } finally {
      setCompletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="content-page">
        <div className="section-shell">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="content-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Learning progress</p>
            <h1 className="page-title">My Enrollment</h1>
          </div>
        </div>

        <div className="section-shell empty-state">
          <p>You don't have an active enrollment yet.</p>
          <Link to="/student/browse" className="primary-btn link-button">
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  const { course, lessons } = enrollment
  const status = enrollment.status

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Learning progress</p>
          <h1 className="page-title">My Enrollment</h1>
        </div>
      </div>

      {error && (
        <div className="section-shell error-panel">
          <p>{error}</p>
        </div>
      )}

      {status === 'pending' && (
        <div className="section-shell notice-panel">
          <div className="card-top">
            <div className="info-block">
              <span className="muted-label">Waiting for approval</span>
              <h3>{course.title}</h3>
            </div>
            <span className="chip neutral">Pending</span>
          </div>
          <p className="post-body">
            Your enrollment request is under review. We’ll update your access as soon as an admin approves it.
          </p>
        </div>
      )}

      {status === 'completed' && (
        <div className="section-shell success-panel">
          <div className="card-top">
            <div className="info-block">
              <span className="muted-label">Course completed</span>
              <h3>{course.title}</h3>
            </div>
            <span className="chip success">Completed</span>
          </div>
          <p className="post-body">🎉 Congratulations! You completed the course.</p>
          <div className="button-row">
            <Link to="/student/browse" className="primary-btn link-button">
              Explore more courses
            </Link>
          </div>
        </div>
      )}

      {status === 'in_progress' && (
        <div className="card-grid">
          <article className="list-card">
            <div className="card-top">
              <div className="info-block">
                <p className="eyebrow">Active course</p>
                <h3>{course.title}</h3>
              </div>
              <span className="chip success">In progress</span>
            </div>

            <div className="info-block">
              <span className="muted-label">Progress</span>
              <p>
                {progress?.completedCount ?? 0} of {progress?.totalLessons ?? 0}{' '}
                lessons completed
              </p>
            </div>

            <div className="progress-track">
              <div
                className="progress-bar"
                style={{ width: `${progress?.percentage ?? 0}%` }}
              />
            </div>
          </article>

          <div className="section-shell lesson-panel">
            <div className="card-top">
              <div className="info-block">
                <p className="eyebrow">Course content</p>
                <h3>Lessons</h3>
              </div>
            </div>

            <div className="lesson-list">
              {lessons?.map((lesson) => {
                const isCompleted = (progress?.completedLessonIds || []).includes(
                  lesson.id
                )
                return (
                  <div key={lesson.id} className="lesson-item">
                    <label className="lesson-toggle">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleComplete(lesson.id)}
                        disabled={isCompleted || completingId === lesson.id}
                      />
                      <span>
                        {lesson.title} <em>({lesson.type})</em>
                      </span>
                    </label>

                    <a
                      href={lesson.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-btn lesson-link"
                    >
                      Open
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyEnrollment