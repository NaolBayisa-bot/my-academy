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

function StatCard({ title, value, subtitle }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: '0', fontSize: '14px', color: '#555' }}>
        {title}
      </h3>
      <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#777', marginBottom: '0' }}>
          {subtitle}
        </p>
      )}
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
    return <div>Loading...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  const { totalStudents, totalCourses, suspendedStudents = 0, completionsPerCategory } =
    stats || {
      totalStudents: 0,
      totalCourses: 0,
      suspendedStudents: 0,
      completionsPerCategory: [],
    }

  return (
    <div>
      <h1>Overview</h1>

      <div style={gridStyle}>
        <StatCard title="Total Students" value={totalStudents} />
        <StatCard title="Total Courses" value={totalCourses} />
        <StatCard
          title="Suspended Students"
          value={suspendedStudents}
          subtitle="suspended accounts"
        />
        {completionsPerCategory.map((category) => (
          <StatCard
            key={category.category_id}
            title={category.name}
            value={category.completions}
            subtitle="completions"
          />
        ))}
      </div>
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '16px',
  marginTop: '16px',
}

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
}

export default Overview
