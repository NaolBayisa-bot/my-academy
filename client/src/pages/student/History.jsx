import { useEffect, useState } from 'react'
import api from '../../api/axios'

function History() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/students/my-history')
        if (!cancelled) setEnrollments(res.data.enrollments)
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

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : 'Unknown'

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

  if (enrollments.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4 text-violet-500">My History</h1>
        <p className="text-slate-400">You have no completed courses yet.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">My History</h1>
      {enrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          className="bg-glass border border-glass-border rounded-xl p-4 mb-4 shadow-glass max-w-md"
        >
          <h3 className="text-xl font-semibold mb-2 text-slate-100">
            {enrollment.course?.title || 'Untitled Course'}
          </h3>
          <p className="text-slate-300 mb-2">
            Category: {enrollment.course?.category?.name || 'Unknown'}
          </p>
          <p className="text-slate-300">Completed: {formatDate(enrollment.completed_at)}</p>
        </div>
      ))}
    </div>
  )
}

export default History
