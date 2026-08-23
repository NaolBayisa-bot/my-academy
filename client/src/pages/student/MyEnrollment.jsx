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
    return <div>Loading...</div>
  }

  if (!enrollment) {
    return (
      <div>
        <h1>My Enrollment</h1>
        <p>You don't have an active enrollment yet.</p>
        <Link to="/student/browse">Browse Courses</Link>
      </div>
    )
  }

  const { course, lessons } = enrollment
  const status = enrollment.status

  return (
    <div>
      <h1>My Enrollment</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {status === 'pending' && (
        <p>
          Waiting for admin approval for course: <strong>{course.title}</strong>
        </p>
      )}

      {status === 'completed' && (
        <>
          <p>🎉 Congratulations! You completed the course.</p>
          <Link to="/student/browse">Go to Browse Courses</Link>
        </>
      )}

      {status === 'in_progress' && (
        <>
          <p>
            <strong>{course.title}</strong>
          </p>
          <p>
            {progress?.completedCount ?? 0} of {progress?.totalLessons ?? 0}{' '}
            lessons completed
          </p>
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '480px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                height: '20px',
                width: `${progress?.percentage ?? 0}%`,
                background: '#4caf50',
                transition: 'width 0.3s',
              }}
            />
          </div>
          {lessons?.map((lesson) => {
            const isCompleted = (progress?.completedLessonIds || []).includes(
              lesson.id
            )
            return (
              <div
                key={lesson.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '8px',
                  maxWidth: '480px',
                }}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => handleComplete(lesson.id)}
                    disabled={isCompleted || completingId === lesson.id}
                  />
                  {lesson.title} ({lesson.type})
                </label>{' '}
                <a href={lesson.url} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

export default MyEnrollment