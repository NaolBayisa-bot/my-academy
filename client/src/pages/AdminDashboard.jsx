import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

// Category-admin statistical dashboard. All data comes from
// GET /api/admin/category-stats: counts, enrollment status distribution,
// completion rate, per-course breakdown and recent activity.

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

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'

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

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) {
    return (
      <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 text-center py-8 text-sm text-muted">
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <p className="m-0 text-red-400 text-sm rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
        {error}
      </p>
    )
  }

  const e = stats.enrollments || {}
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

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Category overview</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">Dashboard</h1>
        </div>
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-1.5 no-underline text-muted hover:text-cyan-default transition-colors text-sm"
        >
          Manage courses →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 max-sm:grid-cols-1">
        <StatCard icon="👥" iconBg="bg-cyan-soft text-cyan-default" label="Students" value={stats.totalStudents} sub="in your category" />
        <StatCard icon="⏳" iconBg="bg-yellow-500/10 text-yellow-300" label="Pending" value={e.pending || 0} sub="enrollment requests" />
        <StatCard icon="📈" iconBg="bg-[rgba(56,215,255,0.12)] text-cyan-default" label="In progress" value={e.in_progress || 0} sub="active learners" />
        <StatCard icon="🏆" iconBg="bg-green-soft text-green-default" label="Completed" value={e.completed || 0} sub="courses finished" />
        <StatCard icon="🎯" iconBg="bg-purple-500/10 text-purple" label="Completion rate" value={`${e.completionRate || 0}%`} sub={`of ${e.total || 0} enrollments`} />
      </div>

      {/* Analytics row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Donut: enrollment status distribution */}
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold m-0 text-base">Enrollment status</h3>
            <span className="chip-style inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">{e.total || 0} total</span>
          </div>

          {totalForDonut === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No enrollments yet.</p>
          ) : (
            <div className="flex items-center gap-8 flex-wrap">
              <div className="w-40 h-40 rounded-full grid place-items-center shrink-0" style={{ background: `conic-gradient(${donutBackground})` }}>
                <div className="w-24 h-24 rounded-full bg-[#0a1524] grid place-items-center leading-tight text-center">
                  <strong className="text-2xl font-extrabold block">{e.completionRate || 0}%</strong>
                  <span className="text-[10px] uppercase tracking-wider text-muted">completed</span>
                </div>
              </div>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5 text-sm flex-1 min-w-[160px]">
                {statusSegments.map((s) => (
                  <li key={s.key} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.key] }} />
                    <span className="text-muted flex-1">{STATUS_LABELS[s.key]}</span>
                    <strong>{s.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Bars: top courses by enrollments */}
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <h3 className="font-bold m-0 text-base mb-5">Top courses by enrollments</h3>
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
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Recent activity + quick facts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 lg:col-span-2">
          <h3 className="font-bold m-0 text-base mb-4">Recent enrollment activity</h3>
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
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium block truncate">
                      {r.student?.name || 'Unknown'}
                      {r.course?.title && <span className="text-muted font-normal"> — {r.course.title}</span>}
                    </span>
                    <span className="text-xs text-muted">{fmtDate(r.enrolled_at)}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    r.status === 'completed' ? 'bg-green-soft text-green-default' :
                    r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-300' :
                    r.status === 'rejected' ? 'bg-pink-500/10 text-pink-300' :
                    'bg-cyan-soft text-cyan-default'
                  }`}>
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-4">
          <h3 className="font-bold m-0 text-base">Quick stats</h3>
          {[['📚 Courses published', stats.totalCourses], ['📝 Total lessons', stats.totalLessons], ['📢 Posts shared', stats.totalPosts]].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-[rgba(9,17,27,0.5)] px-4 py-3">
              <span className="text-sm text-muted">{label}</span>
              <strong className="text-lg">{value}</strong>
            </div>
          ))}
          <Link
            to="/admin/enrollments"
            className="mt-auto inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 text-sm"
          >
            Review pending requests ({e.pending || 0})
          </Link>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
