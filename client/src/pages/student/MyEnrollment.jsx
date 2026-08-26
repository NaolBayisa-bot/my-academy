import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

const POLL_INTERVAL_MS = 30_000

function MyEnrollment() {
  const [enrollment, setEnrollment] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingId, setCompletingId] = useState(null)
  // Status-transition notification: 'approved' | 'rejected' | null
  const [statusNotice, setStatusNotice] = useState(null)
  const prevStatusRef = useRef(undefined)

  const loadEnrollment = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const res = await api.get('/students/my-enrollment')
      const next = res.data.enrollment

      // Detect a status transition caused by an admin action (approve /
      // reject) so we can notify the student. The first-ever load seeds the
      // ref silently — only real transitions raise a notice.
      if (prevStatusRef.current === undefined) {
        prevStatusRef.current = next ? next.status : null
      } else {
        const prev = prevStatusRef.current
        const now = next ? next.status : null
        if (prev && now && prev !== now) {
          if (now === 'in_progress') setStatusNotice('approved')
          else if (now === 'rejected') setStatusNotice('rejected')
          else setStatusNotice(null)
        }
        prevStatusRef.current = now
      }

      setEnrollment(next)
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

    // Poll + focus refresh so admin approval appears without a manual reload.
    // Wrap so the focus Event object isn't passed as `showLoading`.
    const intervalId = setInterval(() => loadEnrollment(), POLL_INTERVAL_MS)
    const onFocus = () => loadEnrollment()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
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
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="page-header mb-6">
          <div>
            <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Learning progress</p>
            <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">My Enrollment</h1>
          </div>
        </div>

        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 empty-state text-center py-10">
          <p>You don't have an active enrollment yet.</p>
          <Link to="/student/browse" className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  const { course } = enrollment
  // Lessons are nested under modules: course.modules[].lessons[]
  const modules = course?.modules || []
  const status = enrollment.status

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Learning progress</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">My Enrollment</h1>
        </div>
      </div>

      {error && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{error}</p>
        </div>
      )}

      {/* Approval / rejection notification banners (shown after a live
          status transition detected by polling or tab focus) */}
      {statusNotice === 'approved' && (
        <div className="section-shell rounded-2xl border border-green-default/30 bg-[rgba(45,212,167,0.08)] p-5 mb-6 flex items-start justify-between gap-4 flex-wrap success-panel">
          <p className="m-0 text-sm">
            ✅ Your enrollment in{' '}
            <span className="font-semibold">{course?.title || 'the course'}</span> was
            approved! Your lessons are ready{status === 'in_progress' ? ' below' : ''}.
          </p>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted hover:text-cyan-default hover:border-cyan-default/40 transition-colors px-4 py-2 rounded-xl text-sm cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
      {statusNotice === 'rejected' && (
        <div className="section-shell rounded-2xl border border-red-500/30 bg-[rgba(239,68,68,0.08)] p-5 mb-6 flex items-start justify-between gap-4 flex-wrap error-panel">
          <p className="m-0 text-sm">
            ❌ Your enrollment request was rejected
            {enrollment.reason ? (
              <>
                {' '}— reason: <span className="font-semibold">{enrollment.reason}</span>
              </>
            ) : null}
            . You can request a different course.
          </p>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted hover:text-cyan-default hover:border-cyan-default/40 transition-colors px-4 py-2 rounded-xl text-sm cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rejected enrollment state */}
      {status === 'rejected' && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Enrollment rejected</span>
              <h3>{course.title}</h3>
            </div>
            <span className="chip inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-300">Rejected</span>
          </div>
          {enrollment.reason && (
            <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0 mt-2">
              Reason: {enrollment.reason}
            </p>
          )}
          <div className="button-row flex flex-wrap items-center gap-2.5 mt-3">
            <Link to="/student/browse" className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              Browse Courses
            </Link>
          </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 notice-panel border-cyan-default/30 bg-[rgba(56,215,255,0.06)]">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Waiting for approval</span>
              <h3>{course.title}</h3>
            </div>
            <span className="chip neutral inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">Pending</span>
          </div>
          <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0">
            Your enrollment request is under review. We’ll update your access as soon as an admin approves it.
          </p>
        </div>
      )}

      {status === 'completed' && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 success-panel border-green-500/30 bg-[rgba(45,212,167,0.08)]">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Course completed</span>
              <h3>{course.title}</h3>
            </div>
            <span className="chip success inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">Completed</span>
          </div>
          <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0">🎉 Congratulations! You completed the course.</p>
          <div className="button-row flex flex-wrap items-center gap-2.5 mt-2">
            <Link to="/student/browse" className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              Explore more courses
            </Link>
          </div>
        </div>
      )}

      {status === 'in_progress' && (
        <div className="card-grid grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <article className="list-card rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30">
            <div className="card-top flex justify-between items-start gap-4">
              <div className="info-block flex flex-col gap-1">
                <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Active course</p>
                <h3>{course.title}</h3>
              </div>
              <span className="chip success inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">In progress</span>
            </div>

            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Progress</span>
              <p>
                {progress?.completedCount ?? 0} of {progress?.totalLessons ?? 0}{' '}
                lessons completed
              </p>
            </div>

            <div className="progress-track h-2 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
              <div
                className="progress-bar h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-300"
                style={{ width: `${progress?.percentage ?? 0}%` }}
              />
            </div>
          </article>

          <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 lesson-panel">
            <div className="card-top flex justify-between items-start gap-4">
              <div className="info-block flex flex-col gap-1">
                <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Course content</p>
                <h3>Modules & Lessons</h3>
              </div>
            </div>

            {(!modules || modules.length === 0) && (
              <p className="text-sm text-muted m-0 py-4 text-center">
                No lessons have been added to this course yet. Check back soon.
              </p>
            )}

            {(modules || []).map((module) => (
              <div key={module.id} className="mb-4 last:mb-0">
                <h4 className="text-sm font-bold text-cyan-default uppercase tracking-wide m-0 mb-2.5">
                  {module.title}
                </h4>
                <div className="lesson-list flex flex-col gap-2.5">
                  {(!module.lessons || module.lessons.length === 0) && (
                    <p className="text-sm text-muted m-0 py-2 text-center">
                      No lessons in this module yet.
                    </p>
                  )}
                  {(module.lessons || []).map((lesson) => {
                const isCompleted = (progress?.completedLessonIds || []).includes(
                  lesson.id
                )
                return (
                  <div key={lesson.id} className="lesson-item flex items-center justify-between gap-4 rounded-xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.5)] px-4 py-3">
                    <label className="lesson-toggle flex items-center gap-2.5 cursor-pointer">
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
                      className="secondary-btn lesson-link inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Open
                    </a>
                  </div>
                )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyEnrollment