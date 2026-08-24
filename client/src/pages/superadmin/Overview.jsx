import { useEffect, useState } from 'react'
import api from '../../api/axios'

// Super admin overview/dashboard page.
//
// Data flow:
//  - GET /api/admin/overview -> aggregate counts for the dashboard:
//    totalStudents, totalCourses, and completionsPerCategory (one entry per
//    category with that category's completed-enrollment count).
//
// This page is the super admin default landing page (/super-admin/dashboard).

const chartPalette = ['#38d4ff', '#2dd4bf', '#8b5cf6', '#f59e0b', '#f472b6', '#a3e635']

function StatCard({ title, value, subtitle, accent = 'cyan' }) {
  return (
    <div className={`stat-card stat-card-${accent}`}>
      <div className="stat-topline flex justify-between items-center">
        <span className="stat-label text-xs uppercase tracking-wider text-muted font-semibold">{title}</span>
        <span className="stat-pill text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-soft text-cyan-default">Live</span>
      </div>
      <div className="stat-value text-3xl font-extrabold tracking-tight">{value}</div>
      {subtitle && <p className="stat-subtitle text-xs text-muted m-0">{subtitle}</p>}
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
          setError(
            err.response?.data?.error ||
            'Failed to load overview. Please try again.'
          )
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
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p>Loading overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const { totalStudents, totalCourses, completionsPerCategory } =
    stats || {
      totalStudents: 0,
      totalCourses: 0,
      completionsPerCategory: [],
    }

  const totalCompletions = completionsPerCategory.reduce(
    (sum, item) => sum + Number(item.completions || 0),
    0
  )

  const chartSegments = completionsPerCategory.reduce((segments, item, index) => {
    const previous = segments.length ? segments[segments.length - 1].end : 0
    const value = Number(item.completions || 0)
    const start = previous
    const end = previous + (value / Math.max(totalCompletions, 1)) * 100
    segments.push({
      name: item.name,
      value,
      start,
      end,
      color: chartPalette[index % chartPalette.length],
    })
    return segments
  }, [])

  const donutBackground = chartSegments.length
    ? chartSegments
      .map(
        (segment) =>
          `${segment.color} ${segment.start}% ${Math.min(segment.end, 100)}%`
      )
      .join(', ')
    : '#102033'

  const maxCategoryValue = Math.max(
    ...completionsPerCategory.map((item) => Number(item.completions || 0)),
    0
  )

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Executive summary</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Overview</h1>
        </div>
      </div>

      <div className="stats-grid grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard title="Total Students" value={totalStudents} subtitle="active learners" accent="cyan" />
        <StatCard title="Total Courses" value={totalCourses} subtitle="available programs" accent="mint" />
        <StatCard title="Completions" value={totalCompletions} subtitle="across all categories" accent="purple" />
      </div>

      <div className="analytics-grid grid gap-5 lg:grid-cols-2">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 chart-panel">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Performance</p>
              <h3>Completion overview</h3>
            </div>
            <span className="chip success inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">{totalCompletions} total</span>
          </div>

          <div className="donut-layout flex items-center gap-8 flex-wrap">
            <div
              className="donut-chart w-40 h-40 rounded-full relative grid place-items-center"
              style={{
                background: `conic-gradient(${donutBackground})`,
              }}
            >
              <div className="donut-center w-24 h-24 rounded-full bg-[#0a1524] grid place-items-center">
                <strong>{totalCompletions}</strong>
                <span>completed</span>
              </div>
            </div>

            <ul className="chart-legend list-none m-0 p-0 flex flex-col gap-2 text-sm [&>li]:flex [&>li]:items-center [&>li]:gap-2.5">
              {chartSegments.length > 0 ? (
                chartSegments.map((segment, index) => (
                  <li key={`${segment.name}-${index}`}>
                    <span
                      className="legend-dot w-3 h-3 rounded-full"
                      style={{ background: segment.color }}
                    />
                    <span>{segment.name}</span>
                    <strong>{segment.value}</strong>
                  </li>
                ))
              ) : (
                <li className="legend-empty text-muted text-sm">No completion data yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Breakdown</p>
              <h3>Category performance</h3>
            </div>
          </div>

          <div className="bar-list flex flex-col gap-4">
            {completionsPerCategory.length > 0 ? (
              completionsPerCategory.map((category, index) => {
                const percent = maxCategoryValue
                  ? (Number(category.completions || 0) / maxCategoryValue) * 100
                  : 0
                return (
                  <div key={category.category_id || index} className="bar-row flex flex-col gap-1.5">
                    <div className="bar-row-top flex justify-between text-sm">
                      <span>{category.name}</span>
                      <strong>{category.completions}</strong>
                    </div>
                    <div className="bar-track h-2 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
                      <div
                        className="bar-fill h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          background: chartPalette[index % chartPalette.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="empty-mini text-sm text-muted">No category completion data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
