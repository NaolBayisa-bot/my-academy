import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import FormField from '../../components/ui/FormField'
import Badge from '../../components/ui/Badge'

function EnrollmentRequests() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [actingId, setActingId] = useState(null)

  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  const [rejectCommentId, setRejectCommentId] = useState(null)
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

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
        if (!cancelled) setRequests(res.data.enrollments || [])
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

  useEffect(() => {
    if (!isSuperAdmin) return

    let cancelled = false
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories')
        if (!cancelled) setCategories(res.data.categories || [])
      } catch {
        // Non-blocking - the page still works without the filter dropdown
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [isSuperAdmin])

  const formatDate = (value) => {
    return value
      ? new Date(value).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Unknown'
  }

  const handleApprove = async (request) => {
    setError(null)
    setSuccess(null)
    setActingId(request.id)
    try {
      await api.patch('/admin/enrollments/' + request.id + '/approve')
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
      setSuccess(
        'Approved ' + (request.student?.name || 'the student') + '\'s enrollment in "' + (request.course?.title || 'the course') + '".'
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

  const openRejectModal = (request) => {
    setRejectCommentId(request.id)
    setRejectComment('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    const request = requests.find((r) => r.id === rejectCommentId)
    if (!request) return

    const reason = rejectComment.trim()
    setError(null)
    setSuccess(null)
    setActingId(request.id)
    try {
      await api.patch('/admin/enrollments/' + request.id + '/reject', { reason })
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
      setSuccess(
        'Rejected ' + (request.student?.name || 'the student') + '\'s enrollment in "' + (request.course?.title || 'the course') + '".'
      )
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to reject enrollment. Please try again.'
      )
    } finally {
      setActingId(null)
      setShowRejectModal(false)
      setRejectCommentId(null)
      setRejectComment('')
    }
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (value, row) => row.student?.name || '-',
    },
    {
      key: 'course',
      header: 'Course',
      render: (value, row) => row.course?.title || '-',
    },
    {
      key: 'requested_at',
      header: 'Requested Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleApprove(row)}
            disabled={actingId === row.id}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openRejectModal(row)}
            disabled={actingId === row.id}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <p className="text-on-surface">Loading enrollment requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <Alert variant="error" message={error} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-on-surface font-headline-lg">
              Enrollment Requests
            </h1>
            <p className="text-on-surface-variant">
              {requests.length} pending request{requests.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {success && (
          <Alert variant="success" message={success} className="mb-4" />
        )}

        {isSuperAdmin && (
          <div className="mb-4">
            <label htmlFor="category-filter" className="text-on-surface-variant mr-2">
              Filter by category:
            </label>
            <select
              id="category-filter"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
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

        {requests.length === 0 && <EmptyState icon="hourglass_bottom" title="No pending enrollment requests." />}

        {requests.length > 0 && (
          <Card>
            <DataTable columns={columns} data={requests} />
          </Card>
        )}

        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject Enrollment Request"
        >
          <FormField
            label="Reason for rejection (optional)"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            as="textarea"
            rows={3}
            placeholder="Provide feedback to the student..."
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} loading={actingId === rejectCommentId}>
              Reject
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default EnrollmentRequests
