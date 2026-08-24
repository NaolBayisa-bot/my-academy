import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

// Enrollment approval page. Works for both:
//  - category_admin: pending enrollments for their own category only.
//  - super_admin:    pending enrollments across ALL categories, with a
//                    category filter dropdown (passes ?categoryId=).
function EnrollmentRequests() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [actingId, setActingId] = useState(null)

  // Category filter (super_admin only).
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  // category_admin shouldn't send a categoryId — the server scopes the query
  // to their own category automatically.
  const getFilterParams = () => {
    if (!isSuperAdmin || !selectedCategoryId) return {}
    return { categoryId: selectedCategoryId }
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await api.get('/admin/enrollments/pending', {
          params: getFilterParams(),
        })
        if (!cancelled) setRequests(res.data.enrollments)
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
            'Failed to load enrollment requests. Please try again.'
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
  }, [selectedCategoryId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load the category list for the super_admin filter dropdown.
  useEffect(() => {
    if (!isSuperAdmin) return

    let cancelled = false
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories')
        if (!cancelled) setCategories(res.data.categories)
      } catch {
        // Non-blocking — the page still works without the filter dropdown.
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [isSuperAdmin])

  const handleApprove = async (request) => {
    setError(null)
    setSuccess(null)
    setActingId(request.id)
    try {
      await api.patch(`/admin/enrollments/${request.id}/approve`)
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
      setSuccess(
        `Approved ${request.student?.name}'s enrollment in "${request.course?.title}".`
      )
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to approve enrollment. Please try again.'
      )
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (request) => {
    const reason = window.prompt(
      `Enter a reason for rejecting ${request.student?.name}'s enrollment (optional):`
    )
    // null means the user cancelled the prompt — do nothing.
    if (reason === null) return

    setError(null)
    setSuccess(null)
    setActingId(request.id)
    try {
      await api.patch(`/admin/enrollments/${request.id}/reject`, { reason })
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
      setSuccess(`Rejected ${request.student?.name}'s enrollment.`)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to reject enrollment. Please try again.'
      )
    } finally {
      setActingId(null)
    }
  }

  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
  }

  if (loading) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p>Loading enrollment requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Access management</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Enrollment Requests</h1>
        </div>
      </div>

      {error && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 success-panel border-green-500/30 bg-[rgba(45,212,167,0.08)]">
          <p>{success}</p>
        </div>
      )}

      {isSuperAdmin && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 request-filter-panel">
          <label htmlFor="category-filter" className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">
            Filter by category
          </label>
          <select
            id="category-filter"
            className="field-select flex flex-col gap-1.5"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 empty-state text-center py-10">
          <p>No pending enrollment requests.</p>
        </div>
      ) : (
        <div className="request-table-wrap rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-4 flex flex-col gap-2">
          <div className="request-table-head grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-4 text-xs uppercase tracking-wider text-muted font-semibold pb-3 border-b border-[rgba(143,170,205,0.12)] max-md:hidden">
            <span>Student</span>
            <span>Course</span>
            <span>Requested</span>
            <span>Actions</span>
          </div>

          {requests.map((request) => (
            <article key={request.id} className="request-row grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-4 items-center py-3 border-b border-[rgba(143,170,205,0.08)] max-md:grid-cols-1">
              <div className="request-student flex items-center gap-3">
                <div className="avatar w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-default to-purple font-black text-[#02131f] grid place-items-center text-sm">
                  {(request.student?.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="info-block flex flex-col gap-1">
                  <strong>{request.student?.name || '—'}</strong>
                  <span>{request.student?.email || 'No email'}</span>
                </div>
              </div>

              <div className="request-course">
                <div className="info-block flex flex-col gap-1">
                  <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Course</span>
                  <strong>{request.course?.title || '—'}</strong>
                </div>
              </div>

              <div className="request-date">
                <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Requested</span>
                <p>{formatDate(request.enrolled_at)}</p>
              </div>

              <div className="request-actions flex gap-2">
                <button
                  type="button"
                  className="primary-btn small inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-3.5 py-2 text-sm rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                  onClick={() => handleApprove(request)}
                  disabled={actingId === request.id}
                >
                  {actingId === request.id ? 'Working...' : 'Approve'}
                </button>
                <button
                  type="button"
                  className="danger-btn inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer small inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-3.5 py-2 text-sm rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  onClick={() => handleReject(request)}
                  disabled={actingId === request.id}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default EnrollmentRequests