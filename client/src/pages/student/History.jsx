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
      <div className="content-page">
        <div className="section-shell">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-page">
        <div className="section-shell error-panel">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="content-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Progress tracker</p>
            <h1 className="page-title">My History</h1>
          </div>
        </div>

        <div className="section-shell empty-state">
          <p>You have no completed courses yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Progress tracker</p>
          <h1 className="page-title">My History</h1>
        </div>
      </div>

      <div className="card-grid">
        {enrollments.map((enrollment) => (
          <article key={enrollment.id} className="list-card history-card">
            <div className="card-top">
              <div className="info-block">
                <p className="eyebrow">Completed</p>
                <h3>{enrollment.course?.title || 'Untitled Course'}</h3>
              </div>
              <span className="chip success">Done</span>
            </div>

            <div className="info-block">
              <span className="muted-label">Category</span>
              <p>{enrollment.course?.category?.name || 'Unknown'}</p>
            </div>

            <div className="info-block">
              <span className="muted-label">Finished</span>
              <p>{formatDate(enrollment.completed_at)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default History