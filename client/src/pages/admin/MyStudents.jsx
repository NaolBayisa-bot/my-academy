import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'

function MyStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/admin/users', {
          params: { role: 'student', categoryId: user.category_id },
        })
        if (!cancelled) setStudents(res.data.users || [])
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load students.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.category_id])

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-primary">person</span>
          </div>
          <span className="text-on-surface">{value || '-'}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (value) => value || '-',
    },
    {
      key: 'currentCourse',
      header: 'Current Course',
      render: (value) => (
        value ? (
          <Link to="/admin/courses/' + value.courseId + '" className="text-primary hover:underline text-sm">
            {value.courseName || 'View Course'}
          </Link>
        ) : '-'
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (status) => {
        const getBadgeStatus = (s) => {
          switch (s) {
            case 'active':
            case 'in_progress':
              return 'in_progress'
            case 'completed':
              return 'completed'
            case 'pending':
              return 'pending'
            default:
              return 'completed'
          }
        }
        return <Badge status={getBadgeStatus(status)}>{status?.replace(/_/g, ' ')}</Badge>
      },
    },
  ]

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10">
          <p className="text-on-surface">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error" message={error} />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-on-surface font-headline-lg">
              My Students
            </h1>
            <p className="text-on-surface-variant">
              {students.length} student{students.length !== 1 ? 's' : ''} in your category
            </p>
          </div>
        </div>

        <Card>
          {students.length === 0 ? (
            <EmptyState
              icon="groups"
              title="No students yet"
              message="When students enroll in your courses, they will appear here."
            />
          ) : (
            <DataTable columns={columns} data={students} />
          )}
        </Card>
      </div>
    </div>
  )
}

export default MyStudents
