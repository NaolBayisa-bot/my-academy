import { useEffect, useState } from 'react'
import api from '../../api/axios'

// Super admin overview/dashboard page.
//
// Data flow:
//  - GET /api/admin/overview -> aggregate counts for the dashboard:
//    totalStudents, totalCourses, rejectedStudents, suspendedStudents, and completionsPerCategory (one entry per
//    category with that category's completed-enrollment count).
//
// This page is the super admin default landing page (/super-admin/dashboard).

function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-glass border border-glass-border rounded-xl shadow-glass p-6 text-center">
      <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-violet-500 mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-500">{subtitle}</p>
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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-violet-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const {
    totalStudents,
    totalCourses,
    suspendedStudents = 0,
    rejectedStudents = 0,
    completionsPerCategory,
  } = stats || {
    totalStudents: 0,
    totalCourses: 0,
    suspendedStudents: 0,
    rejectedStudents: 0,
    completionsPerCategory: [],
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={totalStudents} />
        <StatCard title="Total Courses" value={totalCourses} />
        <StatCard
          title="Suspended Students"
          value={suspendedStudents}
          subtitle="suspended accounts"
        />
        <StatCard
          title="Rejected Students"
          value={rejectedStudents}
          subtitle="rejected enrollments"
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

export default Overview
