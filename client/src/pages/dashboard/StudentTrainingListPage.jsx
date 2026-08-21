import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

export default function StudentTrainingListPage() {
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

  const LockIcon = () => (
    <svg
      className="w-5 h-5 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Available Trainings
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : trainings.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">
            No trainings available yet
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trainings.map((training) => (
            <Card
              key={training.id}
              className={`p-5 flex flex-col gap-3 ${
                training.locked ? 'opacity-75' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {training.locked && <LockIcon />}
                  <h3
                    className={`font-semibold ${
                      training.locked
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {training.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {training.description}
                </p>
                {training.locked && training.lockReason && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                    {training.lockReason}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Category: {training.category?.name} · Difficulty:{' '}
                  {training.difficulty}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {training.modules?.length || 0} modules
                </span>
                {training.locked ? (
                  <span className="text-xs text-slate-400 px-3 py-1.5 border border-slate-200 dark:border-tech-border rounded-md">
                    Locked
                  </span>
                ) : (
                  <Link to={`/trainings/${training.id}`}>
                    <Button size="sm">View Training</Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
