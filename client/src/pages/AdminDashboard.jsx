import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AmbientBackground from '../components/AmbientBackground'
import StatCard from '../components/ui/StatCard'

function AdminDashboard() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [stats, setStats] = useState({
    pendingEnrollments: 0,
    totalCourses: 0,
    totalStudents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadStats = async () => {
      try {
        const [
          pendingRes,
          coursesRes,
          studentsRes,
        ] = await Promise.all([
          api.get('/admin/enrollments/pending', {
            params: isSuperAdmin ? {} : { scope: 'own_category' },
          }),
          api.get('/categories', {
            params: { category_id: user?.category_id },
          }),
          api.get('/admin/users', {
            params: { role: 'student', categoryId: user?.category_id },
          }),
        ])

        if (!cancelled) {
          setStats({
            pendingEnrollments: pendingRes.data.enrollments?.length || 0,
            totalCourses: coursesRes.data.courses?.length || 0,
            totalStudents: studentsRes.data.users?.length || 0,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setStats({
            pendingEnrollments: 0,
            totalCourses: 0,
            totalStudents: 0,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [user?.category_id, isSuperAdmin])

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">
          Admin Dashboard
        </h1>

        <p className="text-on-surface-variant mb-6">
          Welcome back, {user?.name}! Here is an overview of your admin area.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon="hourglass_bottom"
            title="Pending Enrollments"
            value={stats.pendingEnrollments}
            iconBg="bg-warning-container/20"
            iconColor="text-warning"
          />
          <StatCard
            icon="school"
            title="Total Courses"
            value={stats.totalCourses}
          />
          <StatCard
            icon="groups"
            title="Total Students"
            value={stats.totalStudents}
          />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
