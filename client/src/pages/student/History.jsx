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
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="page-header mb-6">
          <div>
            <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Progress tracker</p>
            <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">My History</h1>
          </div>
        </div>

        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 empty-state text-center py-10">
          <p>You have no completed courses yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Progress tracker</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">My History</h1>
        </div>
      </div>

      <div className="card-grid grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((enrollment) => (
          <article key={enrollment.id} className="list-card history-card rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30 rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30">
            <div className="card-top flex justify-between items-start gap-4">
              <div className="info-block flex flex-col gap-1">
                <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Completed</p>
                <h3>{enrollment.course?.title || 'Untitled Course'}</h3>
              </div>
              <span className="chip success inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">Done</span>
            </div>

            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Category</span>
              <p>{enrollment.course?.category?.name || 'Unknown'}</p>
            </div>

            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Finished</span>
              <p>{formatDate(enrollment.completed_at)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default History