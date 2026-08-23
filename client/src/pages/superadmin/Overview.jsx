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
      <div className="stat-topline">
        <span className="stat-label">{title}</span>
        <span className="stat-pill">Live</span>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
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
      <div className="content-page">
        <div className="section-shell">
          <p>Loading overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-page">
        <div className="section-shell error-panel">
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
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Executive summary</p>
          <h1 className="page-title">Overview</h1>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Students" value={totalStudents} subtitle="active learners" accent="cyan" />
        <StatCard title="Total Courses" value={totalCourses} subtitle="available programs" accent="mint" />
        <StatCard title="Completions" value={totalCompletions} subtitle="across all categories" accent="purple" />
      </div>

      <div className="analytics-grid">
        <div className="section-shell chart-panel">
          <div className="card-top">
            <div className="info-block">
              <p className="eyebrow">Performance</p>
              <h3>Completion overview</h3>
            </div>
            <span className="chip success">{totalCompletions} total</span>
          </div>

          <div className="donut-layout">
            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(${donutBackground})`,
              }}
            >
              <div className="donut-center">
                <strong>{totalCompletions}</strong>
                <span>completed</span>
              </div>
            </div>

            <ul className="chart-legend">
              {chartSegments.length > 0 ? (
                chartSegments.map((segment, index) => (
                  <li key={`${segment.name}-${index}`}>
                    <span
                      className="legend-dot"
                      style={{ background: segment.color }}
                    />
                    <span>{segment.name}</span>
                    <strong>{segment.value}</strong>
                  </li>
                ))
              ) : (
                <li className="legend-empty">No completion data yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="section-shell">
          <div className="card-top">
            <div className="info-block">
              <p className="eyebrow">Breakdown</p>
              <h3>Category performance</h3>
            </div>
          </div>

          <div className="bar-list">
            {completionsPerCategory.length > 0 ? (
              completionsPerCategory.map((category, index) => {
                const percent = maxCategoryValue
                  ? (Number(category.completions || 0) / maxCategoryValue) * 100
                  : 0
                return (
                  <div key={category.category_id || index} className="bar-row">
                    <div className="bar-row-top">
                      <span>{category.name}</span>
                      <strong>{category.completions}</strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
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
              <p className="empty-mini">No category completion data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
