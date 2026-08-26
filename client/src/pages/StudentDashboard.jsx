import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import PostsFeed from './PostsFeed'
import { useCategoryCourses } from '../hooks/useCategoryCourses'

// Student statistical dashboard. Aggregates the student's own endpoints:
//  - GET /api/students/my-category-courses -> available courses
//  - GET /api/students/my-enrollment       -> active course + lesson progress
//  - GET /api/students/my-history          -> completed courses
// Posts feed is rendered below the stats section.

function StatCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-2 min-h-[112px] transition-colors duration-200 hover:border-cyan-default/25">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted font-semibold">{label}</span>
        <span className={`w-9 h-9 rounded-xl grid place-items-center text-base ${iconBg}`}>{icon}</span>
      </div>
      <div className="text-3xl font-extrabold tracking-tight leading-none">{value}</div>
      {sub && <p className="text-xs text-muted m-0">{sub}</p>}
    </div>
  )
}

function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const hasCategory = Boolean(user?.category_id)
  const { courses, newCourseIds, markAllSeen } =
    useCategoryCourses(hasCategory)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [enrollmentRes, historyRes] = await Promise.all([
          api.get('/students/my-enrollment'),
          api.get('/students/my-history'),
        ])
        if (cancelled) return

        const enrollment = enrollmentRes.data.enrollment
        const history = historyRes.data.enrollments || []

        // Lesson progress across the active enrollment.
        let progressPct = null
        let lessonsDone = 0
        let lessonsTotal = 0
        if (enrollment && enrollment.status === 'in_progress') {
          try {
            const p = await api.get(`/enrollments/${enrollment.id}/progress`)
            lessonsDone = p.data.completedCount ?? 0
            lessonsTotal = p.data.totalLessons ?? 0
            progressPct = p.data.percentage ?? 0
          } catch {
            /* progress is decorative — ignore failures */
          }
        }

        setStats({
          completedCourses: history.length,
          activeEnrollment: enrollment || null,
          lessonsDone,
          lessonsTotal,
          progressPct,
          recentHistory: history.slice(0, 3),
        })
      } catch {
        if (!cancelled) setStats(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    // Poll + focus refresh so an admin approval (pending -> in_progress)
    // shows up on the dashboard without a manual reload.
    const intervalId = setInterval(load, 30_000)
    window.addEventListener('focus', load)
    return () => {
      cancelled = true
      clearInterval(intervalId)
      window.removeEventListener('focus', load)
    }
  }, [])

  // A student who hasn't picked a category yet must do so first.
  if (!user?.category_id) {
    return <Navigate to="/student/select-category" replace />
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 text-center py-8 text-sm text-muted">
        Loading your dashboard...
      </div>
    )
  }

  const active = stats?.activeEnrollment
  const hasActive = active && active.status === 'in_progress'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Learning overview</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">Welcome back, {(user.name || 'Student').split(' ')[0]}</h1>
        </div>
        <Link
          to="/student/browse"
          className="inline-flex items-center gap-1.5 no-underline text-muted hover:text-cyan-default transition-colors text-sm"
        >
          Browse courses →
        </Link>
      </div>

      {/* New-course notification banner */}
      {newCourseIds.length > 0 && (
        <div className="rounded-2xl border border-green-default/30 bg-[rgba(45,212,167,0.08)] p-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-green-default uppercase tracking-[0.16em] m-0 mb-1">
              🎉 New course{newCourseIds.length > 1 ? 's' : ''} available
            </p>
            <p className="m-0 text-sm">
              Your admin just added{' '}
              <span className="font-semibold">
                {courses
                  .filter((c) => newCourseIds.includes(c.id))
                  .map((c) => c.title)
                  .join(', ')}
              </span>{' '}
              to your category.
            </p>
          </div>
          <button
            type="button"
            onClick={markAllSeen}
            className="border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted hover:text-cyan-default hover:border-cyan-default/40 transition-colors px-4 py-2 rounded-xl text-sm cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 max-sm:grid-cols-1">
        <StatCard icon="📚" iconBg="bg-cyan-soft text-cyan-default" label="Available" value={courses.length} sub="courses in your category" />
        <StatCard icon="🏆" iconBg="bg-green-soft text-green-default" label="Completed" value={stats?.completedCourses ?? 0} sub="courses finished" />
        <StatCard
          icon={hasActive ? '📈' : '💤'}
          iconBg={hasActive ? 'bg-[rgba(56,215,255,0.12)] text-cyan-default' : 'bg-[rgba(148,175,211,0.12)] text-muted'}
          label="Lessons done"
          value={stats ? `${stats.lessonsDone}/${stats.lessonsTotal || '—'}` : '0/—'}
          sub={hasActive ? active.course?.title || 'current course' : 'no active course'}
        />
        <StatCard
          icon="🎯"
          iconBg="bg-purple-500/10 text-purple"
          label="Progress"
          value={stats?.progressPct != null ? `${Math.round(stats.progressPct)}%` : hasActive ? '0%' : '—'}
          sub={hasActive ? 'current course progress' : 'start a course to track'}
        />
      </div>

      {/* Active course progress bar */}
      {hasActive && (
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1">Now learning</p>
              <h3 className="font-bold m-0 text-base">{active.course?.title || 'Your course'}</h3>
            </div>
            <Link
              to="/student/my-enrollment"
              className="inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-4 py-2 rounded-xl text-sm hover:border-cyan-default/50 transition-all duration-200"
            >
              Open lessons
            </Link>
          </div>
          <div className="h-2.5 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-500"
              style={{ width: `${stats.progressPct ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2 m-0">
            {stats.lessonsDone} of {stats.lessonsTotal} lessons completed ({Math.round(stats.progressPct ?? 0)}%)
          </p>
        </section>
      )}

      {/* Recent completions */}
      {(stats?.recentHistory || []).length > 0 && (
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold m-0 text-base">Recently completed</h3>
            <Link to="/student/history" className="text-xs text-cyan-default no-underline hover:underline">view all →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 max-sm:grid-cols-1">
            {stats.recentHistory.map((h) => (
              <div key={h.id} className="rounded-xl border border-[rgba(143,170,205,0.1)] bg-[rgba(9,17,27,0.5)] px-4 py-3 flex flex-col gap-1">
                <span className="text-sm font-medium truncate">{h.course?.title || 'Course'}</span>
                <span className="text-xs text-green-default">🎉 Completed</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available courses in the student's category */}
      <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-bold m-0 text-base">Available courses</h3>
          <Link to="/student/browse" className="text-xs text-cyan-default no-underline hover:underline">
            browse all →
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="text-sm text-muted m-0">
            No courses in your category yet — check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-sm:grid-cols-1">
            {courses.map((course) => {
              const isNew = newCourseIds.includes(course.id)
              return (
                <article
                  key={course.id}
                  className={`rounded-xl border bg-[rgba(9,17,27,0.5)] p-4 flex flex-col gap-2 transition-colors duration-200 ${
                    isNew
                      ? 'border-green-default/40'
                      : 'border-[rgba(143,170,205,0.1)] hover:border-cyan-default/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-sm m-0 leading-snug">{course.title}</h4>
                    {isNew && (
                      <span className="chip inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-soft text-green-default border border-green-default/30">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted m-0 line-clamp-2">
                    {course.description || 'No description provided.'}
                  </p>
                  <Link
                    to="/student/browse"
                    className="text-xs text-cyan-default no-underline mt-auto pt-1 hover:underline"
                  >
                    Request enrollment →
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Community posts feed */}
      <PostsFeed />
    </div>
  )
}

export default StudentDashboard
