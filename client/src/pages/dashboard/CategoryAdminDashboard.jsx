import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Card from '../../components/ui/Card'

export default function CategoryAdminDashboard() {
  const { user } = useAuth()
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/trainings/category')
      setTrainings(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trainings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Category Admin Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your category trainings
          </p>
        </div>
        <Link to="/admin/trainings/new">
          <Button>+ New Training</Button>
        </Link>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : trainings.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No trainings yet
          </p>
          <Link to="/admin/trainings/new">
            <Button>Create your first training</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trainings.map((training) => (
            <Card
              key={training.id}
              className="p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {training.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                  {training.description}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Category: {training.category?.name} · Difficulty:{' '}
                  {training.difficulty} · Status: {training.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/trainings/${training.id}`}>
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
