import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useCategoryCourses } from '../../hooks/useCategoryCourses'

function BrowseCourses() {
  const { user } = useAuth()

  const hasCategory = Boolean(user?.category_id)
  const { courses, fetchError: coursesFetchError } =
    useCategoryCourses(hasCategory)
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
        const enrollmentRes = await api.get('/students/my-enrollment')
        if (cancelled) return
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
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Learning catalog</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Browse Courses</h1>
        </div>
      </div>

      {hasActiveEnrollment && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 notice-panel border-cyan-default/30 bg-[rgba(56,215,255,0.06)]">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Enrollment status</span>
              <p>{bannerMessage}</p>
            </div>
            <span className="chip alert inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-300 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-300">{enrollment.status}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 success-panel border-green-500/30 bg-[rgba(45,212,167,0.08)]">
          <p>{successMessage}</p>
        </div>
      )}
      {requestError && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{requestError}</p>
        </div>
      )}
      {fetchError && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{fetchError}</p>
        </div>
      )}
      {coursesFetchError && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{coursesFetchError}</p>
        </div>
      )}

      {loading && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p>Loading courses...</p>
        </div>
      )}

      {!loading && courses.length === 0 && !fetchError && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 empty-state text-center py-10">
          <p>No courses available in your category yet.</p>
        </div>
      )}

      <div className="card-grid grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <article key={course.id} className="list-card course-card rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30 rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30">
            <div className="card-top flex justify-between items-start gap-4">
              <div className="info-block flex flex-col gap-1">
                <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Course</p>
                <h3>{course.title}</h3>
              </div>
              <span className="chip neutral inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">Open</span>
            </div>

            <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0">
              {course.description || 'No description provided.'}
            </p>

            <div className="meta-row flex flex-wrap gap-3 text-xs text-muted pt-3 border-t border-[rgba(143,170,205,0.1)]">
              <span>{course.category?.name || 'Your category'}</span>
              <span>•</span>
              <span>{course.lessons?.length || 'Flexible'} lessons</span>
            </div>

            <div className="button-row flex flex-wrap items-center gap-2.5 mt-2">
              <button
                type="button"
                className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
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