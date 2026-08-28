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
//
// UX layout (priority-ordered):
//  1. Hero header        — greeting + primary CTA
//  2. New-course banner  — slim, dismissible strip (only when there are new courses)
//  3. Continue-learning  — hero card with progress ring (the #1 student action)
//  4. Two-column area    — main column: stats, completions, courses
//                          right column: community posts feed (sticky on desktop,
//                          promoted above stats on mobile for visibility)

// ---- Small building blocks ---------------------------------------------

function SkeletonBlock({ className = '' }) {
  return <div className={`rounded bg-[rgba(148,175,211,0.15)] animate-shimmer ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-8 w-72 max-w-full" />
      </div>
      <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-5 w-56 max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>
        <SkeletonBlock className="h-2.5 w-full rounded-full" />
      </div>
      <div className="grid gap-4 grid-cols-3 max-sm:grid-cols-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Circular SVG progress ring — no external chart dependency needed.
function ProgressRing({ pct, size = 88, stroke = 8 }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct || 0)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Course progress"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(15,27,40,0.9)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38d7ff" />
            <stop offset="100%" stopColor="#2dd4a7" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 grid place-items-center text-base font-extrabold tracking-tight">
        {clamped}%
      </span>
    </div>
  )
}

function StatCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-2 min-h-[104px] transition-colors duration-200 hover:border-cyan-default/25 focus-within:border-cyan-default/25">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted font-semibold">{label}</span>
        <span className={`w-9 h-9 rounded-xl grid place-items-center text-base ${iconBg}`} aria-hidden="true">{icon}</span>
      </div>
      <div className="text-3xl font-extrabold tracking-tight leading-none">{value}</div>
      {sub && <p className="text-xs text-muted m-0">{sub}</p>}
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ---- Main component -----------------------------------------------------

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
    return <DashboardSkeleton />
  }

  const active = stats?.activeEnrollment
  const hasActive = active && active.status === 'in_progress'
  const isPending = active && active.status === 'pending'
  const newCount = newCourseIds.length
  const firstName = (user.name || 'Student').split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Hero header ---- */}
      <header className="flex items-end justify-between gap-4 flex-wrap animate-fade-up">
        <div>
          <p className="text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Learning overview</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted m-0 mt-1.5">
            {hasActive
              ? `You're ${Math.round(stats.progressPct ?? 0)}% through ${active.course?.title || 'your course'} — keep the momentum going!`
              : isPending
                ? 'Your enrollment request is awaiting admin approval.'
                : 'Pick a course below and start learning today.'}
          </p>
        </div>
        <Link
          to={hasActive ? '/student/my-enrollment' : '/student/browse'}
          className="inline-flex items-center gap-2 no-underline font-semibold text-sm px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-default to-cyan-strong text-[#021522] hover:shadow-[0_0_24px_rgba(56,215,255,0.35)] transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-cyan-default"
        >
          {hasActive ? '▶ Continue learning' : 'Explore courses'}
        </Link>
      </header>

      {/* ---- Slim, dismissible new-course notification ---- */}
      {newCount > 0 && (
        <div
          role="status"
          className="rounded-xl border border-green-default/30 bg-[rgba(45,212,167,0.08)] px-4 py-3 flex items-center justify-between gap-4 flex-wrap animate-fade-up"
        >
          <p className="m-0 text-sm flex items-center gap-2 flex-wrap">
            <span className="chip inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-soft text-green-default border border-green-default/30">
              {newCount} new
            </span>
            <span>
              New course{newCount > 1 ? 's' : ''} added:{' '}
              <span className="font-semibold">
                {courses
                  .filter((c) => newCourseIds.includes(c.id))
                  .map((c) => c.title)
                  .join(', ')}
              </span>
            </span>
          </p>
          <button
            type="button"
            onClick={markAllSeen}
            className="text-xs text-muted hover:text-cyan-default transition-colors bg-transparent border-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-default rounded"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* ---- Continue-learning hero card (primary action, above the fold) ---- */}
      {hasActive && (
        <section
          aria-label="Current course"
          className="rounded-2xl border border-[rgba(123,200,255,0.22)] bg-gradient-to-br from-[rgba(16,30,48,0.95)] to-[rgba(11,20,33,0.95)] p-6 flex items-center justify-between gap-6 flex-wrap shadow-[0_8px_32px_rgba(2,10,20,0.4)] animate-fade-up"
        >
          <div className="flex items-center gap-5 min-w-[220px]">
            <ProgressRing pct={stats.progressPct ?? 0} />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0">Now learning</p>
              <h2 className="font-bold text-lg m-0 leading-snug">{active.course?.title || 'Your course'}</h2>
              <p className="text-xs text-muted m-0">
                {stats.lessonsDone} of {stats.lessonsTotal} lessons completed
              </p>
            </div>
          </div>
          <Link
            to="/student/my-enrollment"
            className="inline-flex items-center gap-2 no-underline border border-[rgba(123,200,255,0.3)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl text-sm hover:border-cyan-default/60 hover:shadow-[0_0_20px_rgba(56,215,255,0.2)] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-cyan-default"
          >
            Resume course →
          </Link>
        </section>
      )}

      {/* Pending-enrollment status state (replaces a silent blank spot) */}
      {isPending && (
        <section
          aria-label="Enrollment pending"
          className="rounded-2xl border border-[rgba(240,200,80,0.3)] bg-[rgba(240,200,80,0.06)] p-5 flex items-center gap-4 flex-wrap animate-fade-up"
        >
          <span className="w-10 h-10 rounded-xl grid place-items-center text-lg bg-[rgba(240,200,80,0.12)]" aria-hidden="true">⏳</span>
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-base m-0">Waiting for approval</h2>
            <p className="text-sm text-muted m-0">
              You requested <span className="font-medium">{active.course?.title || 'a course'}</span> — your admin will review it shortly. This page updates automatically.
            </p>
          </div>
        </section>
      )}

      {/*
        ---- Two-column area ----
        Desktop (lg+): main content left, sticky community feed right —
        the feed is always on screen without scrolling.
        Mobile: feed is promoted to directly under the continue-learning
        card (order-1), before stats/completions/courses (order-2).
      */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start lg:gap-6">
        {/* Main column */}
        <div className="flex flex-col gap-6 order-2 lg:order-1 min-w-0">
          {/* Compact stat strip — 3 non-redundant KPIs */}
          <div className="grid gap-4 grid-cols-3 max-sm:grid-cols-1" aria-label="Your stats">
            <StatCard
              icon="📚"
              iconBg="bg-cyan-soft text-cyan-default"
              label="Available"
              value={courses.length}
              sub={newCount > 0 ? `${newCount} new in your category` : 'courses in your category'}
            />
            <StatCard
              icon="🏆"
              iconBg="bg-green-soft text-green-default"
              label="Completed"
              value={stats?.completedCourses ?? 0}
              sub="courses finished"
            />
            <StatCard
              icon={hasActive ? '🎯' : '💤'}
              iconBg={hasActive ? 'bg-[rgba(56,215,255,0.12)] text-cyan-default' : 'bg-[rgba(148,175,211,0.12)] text-muted'}
              label="Progress"
              value={stats?.progressPct != null ? `${Math.round(stats.progressPct)}%` : hasActive ? '0%' : '—'}
              sub={hasActive ? 'current course' : 'no active course'}
            />
          </div>

          {/* Recent completions */}
          {(stats?.recentHistory || []).length > 0 && (
            <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold m-0 text-base flex items-center gap-2">
                  <span aria-hidden="true">🏅</span> Recently completed
                </h3>
                <Link to="/student/history" className="text-xs text-cyan-default no-underline hover:underline focus-visible:outline-2 focus-visible:outline-cyan-default rounded">
                  view all →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 max-sm:grid-cols-1">
                {stats.recentHistory.map((h) => (
                  <div key={h.id} className="rounded-xl border border-[rgba(143,170,205,0.1)] bg-[rgba(9,17,27,0.5)] px-4 py-3 flex flex-col gap-1 transition-colors duration-200 hover:border-green-default/30">
                    <span className="text-sm font-medium truncate">{h.course?.title || 'Course'}</span>
                    <span className="text-xs text-green-default flex items-center gap-1">
                      <span aria-hidden="true">✓</span> Completed
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Available courses in the student's category */}
          <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-bold m-0 text-base flex items-center gap-2">
                <span aria-hidden="true">📚</span> Available courses
              </h3>
              <Link to="/student/browse" className="text-xs text-cyan-default no-underline hover:underline focus-visible:outline-2 focus-visible:outline-cyan-default rounded">
                browse all →
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-center py-8">
                <span className="text-3xl" aria-hidden="true">🌱</span>
                <p className="text-sm text-muted m-0 max-w-xs">
                  No courses in your category yet — check back soon, or browse what's coming.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 max-sm:grid-cols-1">
                {courses.map((course) => {
                  const isNew = newCourseIds.includes(course.id)
                  return (
                    <article
                      key={course.id}
                      className={`rounded-xl border bg-[rgba(9,17,27,0.5)] p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 ${
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
                        className="text-xs text-cyan-default no-underline mt-auto pt-1 hover:underline focus-visible:outline-2 focus-visible:outline-cyan-default rounded"
                      >
                        Request enrollment →
                      </Link>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Community column — sticky on desktop so it stays visible while
            scrolling course content; scrollable within its own height. */}
        <aside className="order-1 lg:order-2 min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <PostsFeed variant="compact" />
        </aside>
      </div>
    </div>
  )
}

export default StudentDashboard
