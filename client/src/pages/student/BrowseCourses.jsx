import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

function BrowseCourses() {
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [requestingId, setRequestingId] = useState(null)
  const [requestError, setRequestError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const hasActiveEnrollment =
    enrollment && ['pending', 'in_progress'].includes(enrollment.status)

  useEffect(() => {
    if (!user?.category_id) return

    let cancelled = false
    const load = async () => {
      try {
        const [coursesRes, enrollmentRes] = await Promise.all([
          api.get('/students/my-category-courses'),
          api.get('/students/my-enrollment'),
        ])
        if (cancelled) return
        setCourses(coursesRes.data.courses)
        setEnrollment(enrollmentRes.data.enrollment)
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err.response?.data?.error || 'Failed to load courses. Please try again.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.category_id])

  // A student who hasn't picked a category yet must do so first.
  if (!user?.category_id) {
    return <Navigate to="/student/select-category" replace />
  }

  const handleRequest = async (course) => {
    setRequestingId(course.id)
    setRequestError(null)
    setSuccessMessage(null)
    try {
      await api.post('/enrollments', { courseId: course.id })
      setSuccessMessage('Enrollment requested — waiting for admin approval')
      // Optimistically lock the buttons now that a pending enrollment exists.
      setEnrollment({ status: 'pending', course_id: course.id })
    } catch (err) {
      setRequestError(
        err.response?.data?.error || 'Failed to request enrollment. Please try again.'
      )
    } finally {
      setRequestingId(null)
    }
  }

  const bannerMessage = enrollment?.status === 'pending'
    ? 'You have a pending enrollment request. Waiting for admin approval.'
    : 'You have an in-progress course. Finish or withdraw from it before requesting a new enrollment.'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Browse Courses</h1>

      {hasActiveEnrollment && (
        <div className="mb-4 p-3 text-yellow-700 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
          {bannerMessage}
        </div>
      )}
      {successMessage && <p className="mb-4 text-green-500">{successMessage}</p>}
      {requestError && <p className="mb-4 text-red-500">{requestError}</p>}
      {fetchError && <p className="mb-4 text-red-500">{fetchError}</p>}

      {loading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-violet-500">Loading courses...</div>
        </div>
      )}

      {!loading && courses.length === 0 && !fetchError && (
        <p className="text-slate-400">No courses available in your category yet.</p>
      )}

      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-glass border border-glass-border rounded-xl p-4 mb-4 shadow-glass max-w-md"
        >
          <h3 className="text-xl font-semibold mb-2 text-slate-100">{course.title}</h3>
          <p className="text-slate-300 mb-4">{course.description || 'No description provided.'}</p>
          <button
            type="button"
            onClick={() => handleRequest(course)}
            disabled={hasActiveEnrollment || requestingId === course.id}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-violet ${
              hasActiveEnrollment || requestingId === course.id
                ? 'text-slate-500 bg-slate-800 cursor-not-allowed'
                : 'text-white bg-violet-500 hover:bg-violet-600'
            }`}
          >
            {requestingId === course.id
              ? 'Requesting...'
              : 'Request Enrollment'}
          </button>
        </div>
      ))}
    </div>
  )
}

export default BrowseCourses
