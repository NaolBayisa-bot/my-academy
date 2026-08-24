import { useEffect, useState } from 'react'
import api from '../../api/axios'

// Super admin statistical dashboard. Data from GET /api/admin/overview:
// platform counts, global enrollment status distribution + completion rate,
// completions/students per category, and recent student signups.

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#38d7ff',
  completed: '#2dd4a7',
  rejected: '#f472b6',
}

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

function StatCard({ icon, iconBg, title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 min-h-[112px] transition-colors duration-200 hover:border-cyan-default/25">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted font-semibold">{title}</span>
        <span className={`w-9 h-9 rounded-xl grid place-items-center text-base ${iconBg}`}>{icon}</span>
      </div>
      <div className="text-3xl font-extrabold tracking-tight leading-none">{value}</div>
      {subtitle && <p className="text-xs text-muted m-0">{subtitle}</p>}
    </div>
  )
}

function Overview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const loadOverview = async () => {
      try {
        const res = await api.get('/admin/overview')
        if (!cancelled) setStats(res.data)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load overview. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadOverview()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 text-center py-8 text-sm text-muted">
        Loading overview...
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

  const completionsPerCategory = stats.completionsPerCategory || []
  const studentsPerCategory = stats.studentsPerCategory || []
  const byStatus = stats.enrollmentsByStatus || {}
  const totalEnrollments = stats.totalEnrollments || 0

  const totalCompletions = completionsPerCategory.reduce(
    (sum, item) => sum + Number(item.completions || 0),
    0
  )

  // Donut segments: global enrollment status distribution.
  const statusSegments = [
    { key: 'in_progress', value: byStatus.in_progress || 0 },
    { key: 'completed', value: byStatus.completed || 0 },
    { key: 'pending', value: byStatus.pending || 0 },
    { key: 'rejected', value: byStatus.rejected || 0 },
  ]
  let acc = 0
  const donutBackground = totalEnrollments
    ? statusSegments
        .filter((s) => s.value > 0)
        .map((s) => {
          const start = (acc / totalEnrollments) * 100
          acc += s.value
          const end = (acc / totalEnrollments) * 100
          return `${STATUS_COLORS[s.key]} ${start}% ${end}%`
        })
        .join(', ')
    : '#102033'

  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Executive summary</p>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">Platform Overview</h1>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-sm:grid-cols-1">
        <StatCard icon="👥" iconBg="bg-cyan-soft text-cyan-default" title="Students" value={stats.totalStudents} subtitle="registered learners" />
        <StatCard icon="🛡️" iconBg="bg-purple-500/10 text-purple" title="Admins" value={stats.totalAdmins} subtitle="category admins" />
        <StatCard icon="📚" iconBg="bg-green-soft text-green-default" title="Courses" value={stats.totalCourses} subtitle="across all categories" />
        <StatCard icon="📝" iconBg="bg-yellow-500/10 text-yellow-300" title="Lessons" value={stats.totalLessons} subtitle="learning modules" />
        <StatCard icon="🎓" iconBg="bg-[rgba(56,215,255,0.12)] text-cyan-default" title="Enrollments" value={totalEnrollments} subtitle="all time" />
        <StatCard icon="🎯" iconBg="bg-pink-500/10 text-pink-300" title="Completion rate" value={`${stats.completionRate || 0}%`} subtitle="of all enrollments" />
      </div>

      {/* Analytics row 1: status donut + completions per category bars */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold m-0 text-base">Enrollment status</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">{totalEnrollments} total</span>
          </div>

          {totalEnrollments === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No enrollments yet.</p>
          ) : (
            <div className="flex items-center gap-8 flex-wrap">
              <div className="w-40 h-40 rounded-full grid place-items-center shrink-0" style={{ background: `conic-gradient(${donutBackground})` }}>
                <div className="w-24 h-24 rounded-full bg-[#0a1524] grid place-items-center leading-tight text-center">
                  <strong className="text-2xl font-extrabold block">{stats.completionRate || 0}%</strong>
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

        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold m-0 text-base">Completions per category</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-soft text-cyan-default">{totalCompletions} total</span>
          </div>
          {completionsPerCategory.length === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {completionsPerCategory.map((c, i) => {
                const max = Math.max(...completionsPerCategory.map((x) => Number(x.completions || 0)), 1)
                const pct = Math.round((Number(c.completions || 0) / max) * 100)
                const colors = ['#38d4ff', '#2dd4bf', '#8b5cf6', '#f59e0b', '#f472b6', '#a3e635']
                return (
                  <div key={c.category_id || c.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm gap-3">
                      <span className="truncate">{c.name}</span>
                      <strong className="shrink-0">{c.completions}</strong>
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

      {/* Analytics row 2: students per category + recent signups */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold m-0 text-base">Students per category</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 border border-purple/25 text-purple">{stats.totalStudents} students</span>
          </div>
          {studentsPerCategory.length === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {studentsPerCategory.map((c) => {
                const max = Math.max(...studentsPerCategory.map((x) => Number(x.students || 0)), 1)
                const pct = Math.round((Number(c.students || 0) / max) * 100)
                return (
                  <div key={c.category_id || c.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm gap-3">
                      <span className="truncate">{c.name}</span>
                      <strong className="shrink-0">{c.students}</strong>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <h3 className="font-bold m-0 text-base mb-4">Recent signups</h3>
          {(stats.recentStudents || []).length === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No students yet.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col divide-y divide-[rgba(143,170,205,0.08)]">
              {stats.recentStudents.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-default to-purple text-[#02131f] font-black grid place-items-center text-sm">
                    {(s.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium block truncate">{s.name}</span>
                    <span className="text-xs text-muted block truncate">{s.category || 'Uncategorized'} · joined {fmtDate(s.joined_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Content totals strip */}
      <div className="grid gap-4 grid-cols-3">
        {[['📢 Posts published', stats.totalPosts], ['🛡️ Categories', completionsPerCategory.length], ['🎓 Completions', totalCompletions]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.6)] px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-muted">{label}</span>
            <strong className="text-lg">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Overview
