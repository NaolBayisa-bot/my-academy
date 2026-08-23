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
      <div className="content-page">
        <div className="section-shell">
          <p>Loading enrollment requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Access management</p>
          <h1 className="page-title">Enrollment Requests</h1>
        </div>
      </div>

      {error && (
        <div className="section-shell error-panel">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="section-shell success-panel">
          <p>{success}</p>
        </div>
      )}

      {isSuperAdmin && (
        <div className="section-shell request-filter-panel">
          <label htmlFor="category-filter" className="muted-label">
            Filter by category
          </label>
          <select
            id="category-filter"
            className="field-select"
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
        <div className="section-shell empty-state">
          <p>No pending enrollment requests.</p>
        </div>
      ) : (
        <div className="request-table-wrap">
          <div className="request-table-head">
            <span>Student</span>
            <span>Course</span>
            <span>Requested</span>
            <span>Actions</span>
          </div>

          {requests.map((request) => (
            <article key={request.id} className="request-row">
              <div className="request-student">
                <div className="avatar">
                  {(request.student?.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="info-block">
                  <strong>{request.student?.name || '—'}</strong>
                  <span>{request.student?.email || 'No email'}</span>
                </div>
              </div>

              <div className="request-course">
                <div className="info-block">
                  <span className="muted-label">Course</span>
                  <strong>{request.course?.title || '—'}</strong>
                </div>
              </div>

              <div className="request-date">
                <span className="muted-label">Requested</span>
                <p>{formatDate(request.enrolled_at)}</p>
              </div>

              <div className="request-actions">
                <button
                  type="button"
                  className="primary-btn small"
                  onClick={() => handleApprove(request)}
                  disabled={actingId === request.id}
                >
                  {actingId === request.id ? 'Working...' : 'Approve'}
                </button>
                <button
                  type="button"
                  className="danger-btn small"
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