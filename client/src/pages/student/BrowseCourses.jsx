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
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Learning catalog</p>
          <h1 className="page-title">Browse Courses</h1>
        </div>
      </div>

      {hasActiveEnrollment && (
        <div className="section-shell notice-panel">
          <div className="card-top">
            <div className="info-block">
              <span className="muted-label">Enrollment status</span>
              <p>{bannerMessage}</p>
            </div>
            <span className="chip alert">{enrollment.status}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="section-shell success-panel">
          <p>{successMessage}</p>
        </div>
      )}
      {requestError && (
        <div className="section-shell error-panel">
          <p>{requestError}</p>
        </div>
      )}
      {fetchError && (
        <div className="section-shell error-panel">
          <p>{fetchError}</p>
        </div>
      )}

      {loading && (
        <div className="section-shell">
          <p>Loading courses...</p>
        </div>
      )}

      {!loading && courses.length === 0 && !fetchError && (
        <div className="section-shell empty-state">
          <p>No courses available in your category yet.</p>
        </div>
      )}

      <div className="card-grid">
        {courses.map((course) => (
          <article key={course.id} className="list-card course-card">
            <div className="card-top">
              <div className="info-block">
                <p className="eyebrow">Course</p>
                <h3>{course.title}</h3>
              </div>
              <span className="chip neutral">Open</span>
            </div>

            <p className="post-body">
              {course.description || 'No description provided.'}
            </p>

            <div className="meta-row">
              <span>{course.category?.name || 'Your category'}</span>
              <span>•</span>
              <span>{course.lessons?.length || 'Flexible'} lessons</span>
            </div>

            <div className="button-row">
              <button
                type="button"
                className="primary-btn"
                onClick={() => handleRequest(course)}
                disabled={hasActiveEnrollment || requestingId === course.id}
              >
                {requestingId === course.id
                  ? 'Requesting...'
                  : 'Request Enrollment'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default BrowseCourses