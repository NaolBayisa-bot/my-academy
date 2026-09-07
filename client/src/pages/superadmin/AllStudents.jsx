import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { ContentPage, PageHeader, Button, Alert } from '../../components/ui'

// Students overview page shared by two roles:
//  - super_admin     -> every category, each section listing that category's
//                      students (GET /api/admin/students, grouped).
//  - category_admin  -> only the admin's own category, listing just those
//                      students (GET /api/admin/category/:id/students).
//
// For super_admin: actions are exposed (suspend/unsuspend/delete).
// For category_admin: read-only.
const NULL_CATEGORY_ID = '00000000-0000-0000-0000-000000000000'

function AllStudents() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [categories, setCategories] = useState([])
  const [studentsByCategory, setStudentsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)

  const loadCategories = async () => {
    const res = await api.get('/categories')
    setCategories(res.data.categories)
  }

  const loadStudents = async () => {
    if (isSuperAdmin) {
      const res = await api.get('/admin/students')
      setStudentsByCategory(res.data.studentsByCategory || {})
      return
    }

    // category_admin: the server already restricts this to the admin's own
    // category and returns 403 on any mismatch.
    const res = await api.get(`/admin/category/${user?.category_id}/students`)
    setStudentsByCategory({
      [user.category_id]: res.data.students || [],
    })
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await Promise.all([loadCategories(), loadStudents()])
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
            'Failed to load students. Please try again.'
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
  }, [isSuperAdmin, user?.category_id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Action handlers
  const handleSuspend = async (studentId, studentName) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.patch(`/admin/students/${studentId}/suspend`)
      setSuccess(`Student "${studentName}" has been suspended.`)
      // Refresh the students list
      await loadStudents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to suspend student.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspend = async (studentId, studentName) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.patch(`/admin/students/${studentId}/unsuspend`)
      setSuccess(`Student "${studentName}" has been unsuspended.`)
      // Refresh the students list
      await loadStudents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unsuspend student.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (studentId, studentName) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.delete(`/admin/students/${studentId}`)
      setSuccess(`Student "${studentName}" has been deleted.`)
      // Refresh the students list
      await loadStudents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete student.')
    } finally {
      setActionLoading(false)
      setStudentToDelete(null)
    }
  }

  const confirmDelete = (student) => {
    setStudentToDelete(student)
  }

  const cancelDelete = () => {
    setStudentToDelete(null)
  }

  // Categories that get their own section: all of them for a super_admin,
  // only the admin's own category otherwise.
  const visibleCategories = isSuperAdmin
    ? categories
    : categories.filter((category) => category.id === user?.category_id)

  const uncategorized = isSuperAdmin
    ? studentsByCategory[NULL_CATEGORY_ID] || []
    : []

  const renderStudentList = (students) => (
    <div>
      <div className="hidden md:grid grid-cols-[1.6fr_1.4fr_1.4fr_1fr_auto] gap-4 text-xs uppercase tracking-wider text-muted font-semibold pb-3 border-b border-[rgba(143,170,205,0.12)]">
        <span>Name</span>
        <span>Email</span>
        <span>Course</span>
        <span>Status</span>
        {isSuperAdmin && <span>Actions</span>}
      </div>

      {students.map((student) => (
        <article key={student.id} className="flex items-center justify-between gap-4 py-3 border-b border-[rgba(143,170,205,0.08)] max-md:flex-col max-md:items-start max-md:gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-default to-purple font-black text-[#02131f] grid place-items-center text-sm">
              {student.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="flex items-center gap-2">
              <strong>{student.name}</strong>
              {student.suspended && (
                <Alert tone="error" className="!py-0.5 !px-2 text-xs">Suspended</Alert>
              )}
            </div>
          </div>

          <span className="text-sm text-muted min-w-0 truncate max-md:order-3">{student.email}</span>
          <span className="text-sm text-muted min-w-0 truncate max-md:order-4">
            {student.currentEnrollment?.course?.title || '—'}
          </span>

          <span
            className={`chip chip-${
              student.currentEnrollment?.status === 'active' || student.currentEnrollment?.status === 'approved'
                ? 'success'
                : student.currentEnrollment?.status
                  ? 'warning'
                  : 'neutral'
            }`}
          >
            {student.currentEnrollment?.status || 'No enrollment'}
          </span>

          {isSuperAdmin && (
            <div className="flex gap-2">
              {student.suspended ? (
                <Button variant="secondary" size="sm" onClick={() => handleUnsuspend(student.id, student.name)} disabled={actionLoading} title="Unsuspend student">
                  Unsuspend
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => handleSuspend(student.id, student.name)} disabled={actionLoading} title="Suspend student">
                  Suspend
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => confirmDelete(student)} disabled={actionLoading} title="Delete student">
                Delete
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  )

  if (loading) {
    return (
      <ContentPage aria-busy="true" aria-label="Loading students">
        <div className="panel p-5">
          <div className="h-4 w-32 rounded bg-[rgba(148,175,211,0.15)] animate-shimmer" />
        </div>
      </ContentPage>
    )
  }

  if (error && categories.length === 0) {
    return <ContentPage><Alert tone="error">{error}</Alert></ContentPage>
  }

  // Delete confirmation modal
  const renderDeleteModal = () => {
    if (!studentToDelete) return null
    return (
      <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={cancelDelete}>
        <div className="bg-[rgba(13,22,35,0.98)] border border-[rgba(143,170,205,0.18)] rounded-2xl p-6 max-w-md w-full cursor-default animate-pop-in" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold m-0 mb-3">Confirm Deletion</h3>
          <p className="text-sm text-muted m-0 mb-2">
            Are you sure you want to permanently delete "<strong>{studentToDelete.name}</strong>"?
          </p>
          <p className="text-sm text-muted m-0">
            This will remove the student and all their enrollments, progress, and related data.
          </p>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="secondary" onClick={cancelDelete} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => handleDelete(studentToDelete.id, studentToDelete.name)} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete Student'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ContentPage>
      <PageHeader
        title={isSuperAdmin ? 'All Students' : 'My Students'}
        subtitle={
          isSuperAdmin
            ? 'Review all learners, manage suspensions, and delete inactive accounts.'
            : 'Review active learners and their course progress at a glance.'
        }
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}
      {success && <Alert tone="success" className="mb-5">{success}</Alert>}

      {visibleCategories.map((category) => {
        const students = studentsByCategory[category.id] || []
        return (
          <section key={category.id} className="panel-shell p-5 mb-6">
            <div className="flex justify-between items-start gap-4 mb-4">
              <h3 className="font-bold text-base m-0">{category.name}</h3>
              <span className="chip chip-neutral chip-sm">{students.length} students</span>
            </div>
            {students.length === 0 ? (
              <p className="page-subtitle">No students in this category yet.</p>
            ) : (
              renderStudentList(students)
            )}
          </section>
        )
      })}

      {uncategorized.length > 0 && (
        <section key={NULL_CATEGORY_ID} className="panel-shell p-5 mb-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="font-bold text-base m-0">Uncategorized</h3>
            <span className="chip chip-neutral chip-sm">{uncategorized.length} students</span>
          </div>
          {renderStudentList(uncategorized)}
        </section>
      )}

      {renderDeleteModal()}
    </ContentPage>
  )
}

export default AllStudents
