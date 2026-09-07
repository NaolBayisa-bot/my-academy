import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { shortRelativeTime as relTime } from '../../utils/formatters'
import { StatCard, SkeletonBlock, Chip } from '../../components/ui'

// Category-admin statistical dashboard. All data comes from
// GET /api/admin/category-stats: counts, enrollment status distribution,
// completion rate, per-course breakdown and recent activity.
//
// Per-student progress comes from GET /api/admin/category/:categoryId/students,
// which (after the backend extension) returns each enrollment with computed
// lessonsDone / lessonsTotal / progressPct for the student's current course.

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#38d7ff',
  completed: '#2dd4a7',
  rejected: '#f472b6',
}

const STATUS_LABELS = {
  pending: 'Pending approval',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

// Sort priority so students needing attention surface first.
const STATUS_RANK = {
  pending: 0,
  in_progress: 1,
  completed: 2,
  rejected: 3,
}

// ---- Small building blocks ---------------------------------------------

function AdminDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-3 w-36" />
        <SkeletonBlock className="h-8 w-64 max-w-full" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 max-sm:grid-cols-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat-card">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-8 w-14" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel h-56" />
        <div className="panel h-56" />
      </div>
      <div className="panel h-72" />
    </div>
  )
}

// Circular SVG progress bar for table rows.
function MiniProgress({ pct }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct || 0)))
  return (
    <div
      className="flex items-center gap-2.5 min-w-[140px]"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Course progress ${clamped}%`}
    >
      <div className="h-2 flex-1 rounded-full bg-[rgba(15,27,40,0.9)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-bold w-9 text-right shrink-0">{clamped}%</span>
    </div>
  )
}

function statusChip(status) {
  const map = {
    completed: 'success',
    pending: 'warning',
    rejected: 'danger',
    in_progress: 'cyan',
  }
  return (
    <Chip variant={map[status] || 'neutral'} className="shrink-0">
      {STATUS_LABELS[status] || status || 'Not enrolled'}
    </Chip>
  )
}

// ---- Main component -----------------------------------------------------

function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState(null) // null = not loaded / not applicable
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Student-progress filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/admin/category-stats')
        if (!cancelled) setStats(res.data.stats)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load dashboard stats.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Per-student progress — only meaningful for a category_admin with a
  // category (a global super_admin has no students scope).
  useEffect(() => {
    if (!user?.category_id) {
      setStudents([])
      setStudentsLoading(false)
      return
    }
    let cancelled = false
    const loadStudents = async () => {
      try {
        const res = await api.get(`/admin/category/${user.category_id}/students`)
        if (!cancelled) setStudents(res.data.students || [])
      } catch {
        if (!cancelled) setStudents([])
      } finally {
        if (!cancelled) setStudentsLoading(false)
      }
    }
    loadStudents()
    return () => {
      cancelled = true
    }
  }, [user?.category_id])

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  if (error) {
    return (
      <p className="m-0 text-red-400 text-sm rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
        {error}
      </p>
    )
  }

  const e = stats.enrollments || {}
  const pendingCount = e.pending || 0
  const statusSegments = [
    { key: 'in_progress', value: e.in_progress || 0 },
    { key: 'completed', value: e.completed || 0 },
    { key: 'pending', value: e.pending || 0 },
    { key: 'rejected', value: e.rejected || 0 },
  ]
  const totalForDonut = statusSegments.reduce((s, x) => s + x.value, 0)
  let acc = 0
  const donutBackground = totalForDonut
    ? statusSegments
      .filter((s) => s.value > 0)
      .map((s) => {
        const start = (acc / totalForDonut) * 100
        acc += s.value
        const end = (acc / totalForDonut) * 100
        return `${STATUS_COLORS[s.key]} ${start}% ${end}%`
      })
      .join(', ')
    : '#102033'
  const donutSummary = statusSegments.map((s) => `${s.value} ${STATUS_LABELS[s.key]}`).join(', ')

  // Student-progress table data: filter + sort. Students needing attention
  // (pending, then active learners) surface first.
  const filteredStudents = (() => {
    if (!students) return []
    const q = search.trim().toLowerCase()
    return students
      .map((s) => ({ student: s, ce: s.currentEnrollment }))
      .filter(({ student, ce }) => {
        if (statusFilter === 'not_enrolled' && ce) return false
        if (statusFilter !== 'all' && statusFilter !== 'not_enrolled' && (!ce || ce.status !== statusFilter)) return false
        if (!q) return true
        return (
          (student.name || '').toLowerCase().includes(q) ||
          (student.email || '').toLowerCase().includes(q) ||
          (ce?.course?.title || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const rankA = a.ce ? STATUS_RANK[a.ce.status] ?? 4 : 5
        const rankB = b.ce ? STATUS_RANK[b.ce.status] ?? 4 : 5
        if (rankA !== rankB) return rankA - rankB
        // Within the same status, least progress first.
        return (a.ce?.progressPct ?? 0) - (b.ce?.progressPct ?? 0)
      })
  })()

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Header with category identity + urgency CTA ---- */}
      <header className="flex items-end justify-between gap-4 flex-wrap animate-fade-up">
        <div>
          <p className="text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Category overview</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">
            {stats.scope === 'global' ? 'Global overview' : 'Your category'}
          </h1>
          <p className="text-sm text-muted m-0 mt-1.5">
            {stats.totalStudents} students · {stats.totalCourses} courses · {stats.totalLessons} lessons
          </p>
        </div>
        {pendingCount > 0 && (
          <Link
            to="/admin/enrollments"
            className="relative inline-flex items-center gap-2 no-underline font-semibold text-sm px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-default to-cyan-strong text-[#021522] hover:shadow-[0_0_24px_rgba(56,215,255,0.35)] transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-cyan-default"
          >
            Review pending requests
            <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-[#021522]/15 text-xs font-black">{pendingCount}</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 animate-pulse-soft" aria-hidden="true" />
          </Link>
        )}
      </header>

      {/* ---- Pending alert strip ---- */}
      {pendingCount > 0 && (
        <div
          role="status"
          className="rounded-xl border border-yellow-500/30 bg-[rgba(245,158,11,0.07)] px-4 py-3 flex items-center justify-between gap-4 flex-wrap animate-fade-up"
        >
          <p className="m-0 text-sm flex items-center gap-2">
            <span aria-hidden="true">⏳</span>
            <span>
              <span className="font-semibold">{pendingCount}</span> enrollment request{pendingCount > 1 ? 's' : ''} waiting for your approval.
            </span>
          </p>
          <Link
            to="/admin/enrollments"
            className="text-xs font-semibold text-cyan-default no-underline hover:underline focus-visible:outline-2 focus-visible:outline-cyan-default rounded"
          >
            Review now →
          </Link>
        </div>
      )}

      {/* ---- KPI row ---- */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 max-sm:grid-cols-1" aria-label="Key metrics">
        <StatCard icon="👥" iconBg="bg-cyan-soft text-cyan-default" title="Students" value={stats.totalStudents} subtitle="in your category" />
        <StatCard icon="⏳" iconBg="bg-yellow-500/10 text-yellow-300" title="Pending" value={pendingCount} subtitle="enrollment requests" to="/admin/enrollments" />
        <StatCard icon="📈" iconBg="bg-[rgba(56,215,255,0.12)] text-cyan-default" title="In progress" value={e.in_progress || 0} subtitle="active learners" />
        <StatCard icon="🎯" iconBg="bg-purple-500/10 text-purple" title="Completion rate" value={`${e.completionRate || 0}%`} subtitle={`of ${e.total || 0} enrollments`} />
      </div>

      {/*
        ---- Two-column area ----
        Main column: analytics + student progress.
        Right rail: quick actions (promoted to the top for visibility) +
        recent activity — sticky on desktop so actions stay on screen.
      */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start lg:gap-6">
      {/* Main column */}
      <div className="flex flex-col gap-5 min-w-0">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Donut: enrollment status distribution */}
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold m-0 text-base">Enrollment status</h3>
            <span className="chip-style inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">{e.total || 0} total</span>
          </div>

          {totalForDonut === 0 ? (
            <div className="flex flex-col items-center gap-2 text-center py-8">
              <span className="text-3xl" aria-hidden="true">🥚</span>
              <p className="text-sm text-muted m-0">No enrollments yet — publish a course to get started.</p>
            </div>
          ) : (
            <div
              className="flex items-center gap-8 flex-wrap"
              role="img"
              aria-label={`Enrollment status distribution: ${donutSummary}`}
            >
              <div className="w-40 h-40 rounded-full grid place-items-center shrink-0 transition-transform duration-200 hover:scale-[1.03]" style={{ background: `conic-gradient(${donutBackground})` }}>
                <div className="w-24 h-24 rounded-full bg-[#0a1524] grid place-items-center leading-tight text-center">
                  <strong className="text-2xl font-extrabold block">{e.completionRate || 0}%</strong>
                  <span className="text-[10px] uppercase tracking-wider text-muted">completed</span>
                </div>
              </div>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5 text-sm flex-1 min-w-[160px]">
                {statusSegments.map((s) => (
                  <li key={s.key} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.key] }} aria-hidden="true" />
                    <span className="text-muted flex-1">{STATUS_LABELS[s.key]}</span>
                    <span className="text-xs text-muted w-9 text-right">{totalForDonut ? Math.round((s.value / totalForDonut) * 100) : 0}%</span>
                    <strong className="w-6 text-right">{s.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Bars: top courses by enrollments */}
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <h3 className="font-bold m-0 text-base">Top courses by enrollments</h3>
            <Link to="/admin/courses" className="text-xs text-cyan-default no-underline hover:underline focus-visible:outline-2 focus-visible:outline-cyan-default rounded">manage courses →</Link>
          </div>
          {(stats.perCourse || []).length === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No courses yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {stats.perCourse.map((c, i) => {
                const max = Math.max(...stats.perCourse.map((x) => x.enrollments), 1)
                const pct = Math.round((c.enrollments / max) * 100)
                const colors = ['#38d7ff', '#2dd4a7', '#9c7bff', '#f59e0b', '#f472b6']
                return (
                  <div key={c.title} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm gap-3">
                      <span className="truncate">{c.title}</span>
                      <strong className="shrink-0">{c.enrollments}</strong>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ---- Student progress table ---- */}
      <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 animate-fade-up">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h3 className="font-bold m-0 text-base flex items-center gap-2">
            <span aria-hidden="true">📊</span> Student progress
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Search name, email or course…"
              aria-label="Search students"
              className="text-sm bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.18)] rounded-xl px-3 py-2 outline-none focus:border-cyan-default/50 placeholder:text-muted min-w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(ev) => setStatusFilter(ev.target.value)}
              aria-label="Filter by status"
              className="text-sm bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.18)] rounded-xl px-3 py-2 outline-none focus:border-cyan-default/50 cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="in_progress">In progress</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="not_enrolled">Not enrolled</option>
            </select>
          </div>
        </div>

        {studentsLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <SkeletonBlock className="h-9 w-9 rounded-full shrink-0" />
                <SkeletonBlock className="h-4 flex-1 max-w-[180px]" />
                <SkeletonBlock className="h-3 flex-1" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center py-8">
            <span className="text-3xl" aria-hidden="true">🔍</span>
            <p className="text-sm text-muted m-0">
              {students.length === 0 ? 'No students in your category yet.' : 'No students match your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted">
                  <th scope="col" className="font-semibold py-2 pr-4">Student</th>
                  <th scope="col" className="font-semibold py-2 pr-4">Current course</th>
                  <th scope="col" className="font-semibold py-2 pr-4">Progress</th>
                  <th scope="col" className="font-semibold py-2 pr-4">Status</th>
                  <th scope="col" className="font-semibold py-2">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(({ student, ce }) => (
                  <tr key={student.id} className="border-t border-[rgba(143,170,205,0.08)] hover:bg-[rgba(15,27,40,0.4)] transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0 bg-cyan-soft text-cyan-default"
                          aria-hidden="true"
                        >
                          {(student.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{student.name || 'Unknown'}</span>
                          <span className="text-xs text-muted truncate">{student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-muted">
                      {ce?.course?.title || <span className="italic">Not enrolled</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      {ce && (ce.status === 'in_progress' || ce.status === 'completed') ? (
                        <MiniProgress pct={ce.progressPct} />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">{statusChip(ce?.status)}</td>
                    <td className="py-2.5 text-xs text-muted" title={ce?.enrolled_at ? new Date(ce.enrolled_at).toLocaleString() : undefined}>
                      {ce ? relTime(ce.completed_at || ce.enrolled_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

        {/* Recent enrollment activity */}
        <section
          aria-label="Recent enrollment activity"
          className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5"
        >
          <h3 className="font-bold m-0 text-base mb-4">Recent activity</h3>
{(stats.recentEnrollments || []).length === 0 ? (
            <p className="text-sm text-muted text-center py-6 m-0">No activity yet.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col divide-y divide-[rgba(143,170,205,0.08)]">
              {stats.recentEnrollments.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: STATUS_COLORS[r.status] || '#95a9bc' }}
                    title={STATUS_LABELS[r.status] || r.status}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium block truncate">
                      {r.student?.name || 'Unknown'}
                      {r.course?.title && <span className="text-muted font-normal"> — {r.course.title}</span>}
                    </span>
                    <span className="text-xs text-muted">{relTime(r.enrolled_at)}</span>
                  </div>
                  {statusChip(r.status)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Right rail — quick actions first (most visible), then recent activity; sticky on desktop */}
      <aside className="flex flex-col gap-5 min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
        <section
          aria-label="Quick actions"
          className="rounded-2xl border border-[rgba(123,200,255,0.22)] bg-gradient-to-br from-[rgba(16,30,48,0.95)] to-[rgba(11,20,33,0.95)] p-5 flex flex-col gap-3 shadow-[0_8px_32px_rgba(2,10,20,0.35)] animate-fade-up"
        >
          <h3 className="font-bold m-0 text-base flex items-center gap-2">
            <span aria-hidden="true">⚡</span> Quick actions
          </h3>
<div className="grid grid-cols-2 gap-3">
            {[
              { to: '/admin/courses', icon: '📚', label: 'Manage courses' },
              { to: '/admin/enrollments', icon: '📝', label: 'Requests' },
              { to: '/admin/students', icon: '👥', label: 'My students' },
              { to: '/admin/posts', icon: '📢', label: 'Publish post' },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="rounded-xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.5)] px-4 py-3.5 flex flex-col gap-1.5 no-underline transition-all duration-200 hover:border-cyan-default/30 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-cyan-default"
              >
                <span className="text-lg" aria-hidden="true">{a.icon}</span>
                <span className="text-xs font-semibold">{a.label}</span>
              </Link>
            ))}
          </div>
          <Link
            to="/admin/enrollments"
            className="mt-auto inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 text-sm focus-visible:outline-2 focus-visible:outline-cyan-default"
          >
            Review pending requests ({pendingCount})
          </Link>
        </section>
      </aside>

      </div>
    </div>
  )
}

export default AdminDashboard
