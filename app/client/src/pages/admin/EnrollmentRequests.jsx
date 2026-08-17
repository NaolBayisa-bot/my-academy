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
    return <div>Loading...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  return (
    <div>
      <h1>Enrollment Requests</h1>

      {success && (
        <p
          role="status"
          style={{
            color: 'green',
            background: '#e8f5e9',
            border: '1px solid #66bb6a',
            borderRadius: '6px',
            padding: '10px 12px',
            maxWidth: '720px',
          }}
        >
          {success}
        </p>
      )}

      {isSuperAdmin && (
        <div style={{ margin: '12px 0' }}>
          <label htmlFor="category-filter" style={{ marginRight: '8px' }}>
            Filter by category:
          </label>
          <select
            id="category-filter"
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

      {requests.length === 0 && <p>No pending enrollment requests.</p>}

      {requests.length > 0 && (
        <table
          style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '840px' }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Student</th>
              <th style={thStyle}>Course</th>
              <th style={thStyle}>Requested Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td style={tdStyle}>{request.student?.name || '—'}</td>
                <td style={tdStyle}>{request.course?.title || '—'}</td>
                <td style={tdStyle}>{formatDate(request.enrolled_at)}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(request)}
                      disabled={actingId === request.id}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(request)}
                      disabled={actingId === request.id}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'left',
  background: '#f5f5f5',
}

const tdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
}

export default EnrollmentRequests