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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Enrollment Requests</h1>

      {success && (
        <p
          role="status"
          className="mb-4 p-3 text-green-700 bg-green-900/20 border border-green-500 rounded-lg"
        >
          {success}
        </p>
      )}

      {isSuperAdmin && (
        <div className="mb-4">
          <label htmlFor="category-filter" className="text-slate-300 mr-2">
            Filter by category:
          </label>
          <select
            id="category-filter"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
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

      {requests.length === 0 && <p className="text-slate-400">No pending enrollment requests.</p>}

      {requests.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-glass border border-glass-border rounded-xl">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-slate-300">Student</th>
                <th className="px-4 py-3 text-left text-slate-300">Course</th>
                <th className="px-4 py-3 text-left text-slate-300">Requested Date</th>
                <th className="px-4 py-3 text-left text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-glass-border">
                  <td className="px-4 py-3 text-slate-100">{request.student?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{request.course?.title || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{formatDate(request.enrolled_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(request)}
                        disabled={actingId === request.id}
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-900/20 border border-green-500/50 rounded transition-violet disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(request)}
                        disabled={actingId === request.id}
                        className="px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-900/20 border border-yellow-500/50 rounded transition-violet disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EnrollmentRequests
