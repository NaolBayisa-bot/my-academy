import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AmbientBackground from '../components/AmbientBackground'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'

function SuperAdminDashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/admin/overview')
        if (!cancelled) setOverview(res.data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error || 'Failed to load dashboard data.'
          )
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
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10">
          <p className="text-on-surface">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <Alert variant="error" message={error} />
        </div>
      </div>
    )
  }

  const stats = overview?.stats || {}
  const categories = overview?.categories || []

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6">
        <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">
          Overview
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon="groups"
            title="Total Students"
            value={stats.totalStudents}
          />
          <StatCard
            icon="school"
            title="Total Courses"
            value={stats.totalCourses}
          />
          <StatCard
            icon="check_circle"
            title="Total Completions"
            value={stats.totalCompletions}
          />
        </div>

        <h2 className="text-2xl font-semibold text-on-surface mb-4 font-headline-lg">
          Categories
        </h2>

        {categories.length === 0 && (
          <Card>
            <p className="text-on-surface-muted text-center py-6">
              No categories found.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-on-surface">
                  {cat.name}
                </h3>
                {cat.admin && (
                  <span className="material-symbols-outlined text-sm text-primary">admin_panel_settings</span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant mb-4">
                {cat.studentCount || 0} students
              </p>
              <StatCard
                icon="check_circle"
                title="Completions"
                value={cat.completionCount || 0}
                iconBg="bg-tertiary/20"
                iconColor="text-tertiary"
              />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard
