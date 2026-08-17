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
    <div>
      <h1>Browse Courses</h1>

      {hasActiveEnrollment && (
        <div style={{ padding: '12px', marginBottom: '16px', background: '#fff3cd', border: '1px solid #ffc107' }}>
          {bannerMessage}
        </div>
      )}
      {successMessage && (
        <p style={{ color: 'green' }}>{successMessage}</p>
      )}
      {requestError && <p style={{ color: 'red' }}>{requestError}</p>}
      {fetchError && <p style={{ color: 'red' }}>{fetchError}</p>}

      {loading && <div>Loading courses...</div>}

      {!loading && courses.length === 0 && !fetchError && (
        <p>No courses available in your category yet.</p>
      )}

      {courses.map((course) => (
        <div
          key={course.id}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            maxWidth: '480px',
          }}
        >
          <h3>{course.title}</h3>
          <p>{course.description || 'No description provided.'}</p>
          <button
            type="button"
            onClick={() => handleRequest(course)}
            disabled={hasActiveEnrollment || requestingId === course.id}
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