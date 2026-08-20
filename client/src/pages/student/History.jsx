import { useEffect, useState } from 'react'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

function History() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/students/my-history')
        if (!cancelled) setEnrollments(res.data.enrollments || [])
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error || 'Failed to load history. Please try again.'
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

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Unknown'
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10">
          <Card>
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">hourglass_bottom</span>
              <p className="text-on-surface">Loading history...</p>
            </div>
          </Card>
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

  if (enrollments.length === 0) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 w-full max-w-md">
          <EmptyState
            icon="history"
            title="No History Yet"
            message="You haven't completed any courses yet. Browse courses to get started!"
          />
        </div>
      </div>
    )
  }

  const completedEnrollments = enrollments.filter(e => e.status === 'completed')

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6">
        <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">
          Learning History
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <div className="text-center p-4">
              <p className="text-3xl font-bold text-on-surface">{enrollments.length}</p>
              <p className="text-sm text-on-surface-variant">Total Enrollments</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-3xl font-bold text-tertiary">{completedEnrollments.length}</p>
              <p className="text-sm text-on-surface-variant">Completed</p>
            </div>
          </Card>
        </div>

        <h2 className="text-2xl font-semibold text-on-surface mb-4">
          Completed Courses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedEnrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge status="completed">COMPLETED</Badge>
                </div>

                <h3 className="text-lg font-semibold text-on-surface mb-1">
                  {enrollment.course?.title || 'Untitled Course'}
                </h3>

                <p className="text-sm text-on-surface-variant mb-2">
                  Completed: {formatDate(enrollment.completed_at)}
                </p>

                <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                  {enrollment.course?.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    {enrollment.course?.category?.name || 'General'}
                  </span>
                  <Link to="/student/browse" className="inline-block">
                    <Button variant="secondary" size="sm">
                      View Course
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default History
