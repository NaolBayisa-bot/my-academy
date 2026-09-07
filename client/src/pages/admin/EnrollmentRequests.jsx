import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatters'
import {
  ContentPage,
  PageHeader,
  Button,
  Select,
  Alert,
} from '../../components/ui'

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

  if (loading) {
    return (
      <ContentPage>
        <div className="panel-shell p-5 mb-6">
          <p>Loading enrollment requests...</p>
        </div>
      </ContentPage>
    )
  }

  return (
    <ContentPage>
      <PageHeader eyebrow="Access management" title="Enrollment Requests" />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}
      {success && <Alert tone="success" className="mb-5">{success}</Alert>}

      {isSuperAdmin && (
        <div className="panel-shell p-5 mb-6 flex flex-col gap-1.5 max-w-sm">
          <label htmlFor="category-filter" className="field-label text-xs uppercase tracking-wider">
            Filter by category
          </label>
          <Select
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
          </Select>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="panel-shell p-5 mb-6 text-center py-10">
          <p>No pending enrollment requests.</p>
        </div>
      ) : (
        <div className="panel-shell p-4 flex flex-col gap-2">
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-4 text-xs uppercase tracking-wider text-muted font-semibold pb-3 border-b border-[rgba(143,170,205,0.12)] max-md:hidden">
            <span>Student</span>
            <span>Course</span>
            <span>Requested</span>
            <span>Actions</span>
          </div>

          {requests.map((request) => (
            <article key={request.id} className="grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-4 items-center py-3 border-b border-[rgba(143,170,205,0.08)] max-md:grid-cols-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-default to-purple font-black text-[#02131f] grid place-items-center text-sm">
                  {(request.student?.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-1">
                  <strong>{request.student?.name || '—'}</strong>
                  <span className="text-xs text-muted">{request.student?.email || 'No email'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Course</span>
                <strong>{request.course?.title || '—'}</strong>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Requested</span>
                <p className="m-0">{formatDate(request.enrolled_at)}</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(request)} disabled={actingId === request.id}>
                  {actingId === request.id ? 'Working...' : 'Approve'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleReject(request)} disabled={actingId === request.id}>
                  Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </ContentPage>
  )
}

export default EnrollmentRequests
