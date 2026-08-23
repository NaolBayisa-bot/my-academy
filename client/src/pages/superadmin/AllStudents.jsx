import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

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
    if (!window.confirm(`Are you sure you want to delete "${studentName}"? This action cannot be undone.`)) {
      return
    }
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
    <div className="student-list-wrap">
      <div className="student-list-head">
        <span>Name</span>
        <span>Email</span>
        <span>Course</span>
        <span>Status</span>
        {isSuperAdmin && <span className="student-actions-col">Actions</span>}
      </div>

      {students.map((student) => (
        <article key={student.id} className="student-row">
          <div className="student-name-block">
            <div className="avatar">{student.name?.charAt(0)?.toUpperCase() || 'S'}</div>
            <div>
              <strong>{student.name}</strong>
              {student.suspended && (
                <span className="chip error" style={{ marginLeft: '8px' }}>
                  Suspended
                </span>
              )}
            </div>
          </div>

          <span className="student-email">{student.email}</span>
          <span className="student-course">{student.currentEnrollment?.course?.title || '—'}</span>

          <span
            className={`status-inline ${student.currentEnrollment?.status === 'active' || student.currentEnrollment?.status === 'approved'
                ? 'live'
                : student.currentEnrollment?.status
                  ? 'pending'
                  : 'neutral'
              }`}
          >
            {student.currentEnrollment?.status || 'No enrollment'}
          </span>

          {isSuperAdmin && (
            <div className="student-actions">
              {student.suspended ? (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleUnsuspend(student.id, student.name)}
                  disabled={actionLoading}
                  title="Unsuspend student"
                >
                  ✓
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleSuspend(student.id, student.name)}
                  disabled={actionLoading}
                  title="Suspend student"
                >
                  ⸍
                </button>
              )}
              <button
                type="button"
                className="danger-btn"
                onClick={() => confirmDelete(student)}
                disabled={actionLoading}
                title="Delete student"
              >
                ✕
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  )

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <p className="form-error">{error}</p>
  }

  // Delete confirmation modal
  const renderDeleteModal = () => {
    if (!studentToDelete) return null
    return (
      <div className="modal-overlay" onClick={cancelDelete}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to permanently delete "<strong>{studentToDelete.name}</strong>"?</p>
          <p>This will remove the student and all their enrollments, progress, and related data.</p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={cancelDelete} disabled={actionLoading}>
              Cancel
            </button>
            <button className="danger-btn" onClick={() => handleDelete(studentToDelete.id, studentToDelete.name)} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete Student'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isSuperAdmin ? 'All Students' : 'My Students'}</h1>
          <p className="page-subtitle">
            {isSuperAdmin
              ? 'Review all learners, manage suspensions, and delete inactive accounts.'
              : 'Review active learners and their course progress at a glance.'
            }
          </p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {visibleCategories.map((category) => {
        const students = studentsByCategory[category.id] || []
        return (
          <section key={category.id} className="section-shell">
            <div className="card-top" style={{ marginBottom: '16px' }}>
              <h3>{category.name}</h3>
              <span className="chip neutral">{students.length} students</span>
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
        <section key={NULL_CATEGORY_ID} className="section-shell">
          <div className="card-top" style={{ marginBottom: '16px' }}>
            <h3>Uncategorized</h3>
            <span className="chip neutral">{uncategorized.length} students</span>
          </div>
          {renderStudentList(uncategorized)}
        </section>
      )}

      {renderDeleteModal()}
    </div>
  )
}

export default AllStudents
