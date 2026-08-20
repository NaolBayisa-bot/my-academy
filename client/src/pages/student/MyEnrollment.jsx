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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-violet-500">Loading...</div>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4 text-violet-500">My Enrollment</h1>
        <p className="text-slate-300 mb-4">You don't have an active enrollment yet.</p>
        <Link
          to="/student/browse"
          className="text-violet-500 hover:text-violet-400 transition-violet font-medium"
        >
          Browse Courses
        </Link>
      </div>
    )
  }

  const { course, lessons } = enrollment
  const status = enrollment.status

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">My Enrollment</h1>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      {status === 'pending' && (
        <p className="mb-4 text-slate-300">
          Waiting for admin approval for course: <strong className="text-slate-100">{course.title}</strong>
        </p>
      )}

      {status === 'completed' && (
        <>
          <p className="mb-4 text-green-400 text-lg">🎉 Congratulations! You completed the course.</p>
          <Link
            to="/student/browse"
            className="text-violet-500 hover:text-violet-400 transition-violet font-medium"
          >
            Go to Browse Courses
          </Link>
        </>
      )}

      {status === 'in_progress' && (
        <>
          <p className="mb-2 text-slate-300">
            <strong className="text-slate-100">{course.title}</strong>
          </p>
          <p className="mb-4 text-slate-400">
            {progress?.completedCount ?? 0} of {progress?.totalLessons ?? 0}{' '}
            lessons completed
          </p>
          <div className="mb-6">
            <div className="bg-slate-800 rounded-full h-8 overflow-hidden">
              <div
                className="bg-violet-500 h-full transition-all duration-300"
                style={{ width: `${progress?.percentage ?? 0}%` }}
              />
            </div>
          </div>
          {lessons?.map((lesson) => {
            const isCompleted = (progress?.completedLessonIds || []).includes(
              lesson.id
            )
            return (
              <div
                key={lesson.id}
                className="bg-glass border border-glass-border rounded-xl p-3 mb-3 shadow-glass max-w-md"
              >
                <label className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleComplete(lesson.id)}
                      disabled={isCompleted || completingId === lesson.id}
                      className="w-4 h-4 text-violet-500 border border-slate-600 rounded focus:ring-violet-500"
                    />
                    <span className={`text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {lesson.title} ({lesson.type})
                    </span>
                  </div>
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-500 hover:text-violet-400 transition-violet text-sm"
                  >
                    Open
                  </a>
                </label>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

export default MyEnrollment
