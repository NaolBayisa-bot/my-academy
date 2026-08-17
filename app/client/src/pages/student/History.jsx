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
    return <div>Loading...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  if (enrollments.length === 0) {
    return (
      <div>
        <h1>My History</h1>
        <p>You have no completed courses yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h1>My History</h1>
      {enrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            maxWidth: '480px',
          }}
        >
          <h3>{enrollment.course?.title || 'Untitled Course'}</h3>
          <p>Category: {enrollment.course?.category?.name || 'Unknown'}</p>
          <p>Completed: {formatDate(enrollment.completed_at)}</p>
        </div>
      ))}
    </div>
  )
}

export default History