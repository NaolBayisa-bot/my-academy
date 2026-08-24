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
        <article key={student.id} className="student-row flex items-center justify-between gap-4 py-3 border-b border-[rgba(143,170,205,0.08)]">
          <div className="student-name-block">
            <div className="avatar w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-default to-purple font-black text-[#02131f] grid place-items-center text-sm">{student.name?.charAt(0)?.toUpperCase() || 'S'}</div>
            <div>
              <strong>{student.name}</strong>
              {student.suspended && (
                <span className="chip alert inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-300 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-300" style={{ marginLeft: '8px' }}>
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
                  className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  onClick={() => handleUnsuspend(student.id, student.name)}
                  disabled={actionLoading}
                  title="Unsuspend student"
                >
                  Unsusp
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  onClick={() => handleSuspend(student.id, student.name)}
                  disabled={actionLoading}
                  title="Suspend student"
                >
                  Susp
                </button>
              )}
              <button
                type="button"
                className="danger-btn inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                onClick={() => confirmDelete(student)}
                disabled={actionLoading}
                title="Delete student"
              >
                Del
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
    return <p className="form-error text-red-400 text-sm m-0">{error}</p>
  }

  // Delete confirmation modal
  const renderDeleteModal = () => {
    if (!studentToDelete) return null
    return (
      <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={cancelDelete}>
        <div className="modal bg-[rgba(13,22,35,0.98)] border border-[rgba(143,170,205,0.18)] rounded-2xl p-6 max-w-md w-full cursor-default animate-pop-in" onClick={(e) => e.stopPropagation()}>
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to permanently delete "<strong>{studentToDelete.name}</strong>"?</p>
          <p>This will remove the student and all their enrollments, progress, and related data.</p>
          <div className="modal-actions flex justify-end gap-3 mt-5">
            <button className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" onClick={cancelDelete} disabled={actionLoading}>
              Cancel
            </button>
            <button className="danger-btn inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" onClick={() => handleDelete(studentToDelete.id, studentToDelete.name)} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete Student'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">{isSuperAdmin ? 'All Students' : 'My Students'}</h1>
          <p className="page-subtitle text-sm text-muted mt-1.5">
            {isSuperAdmin
              ? 'Review all learners, manage suspensions, and delete inactive accounts.'
              : 'Review active learners and their course progress at a glance.'
            }
          </p>
        </div>
      </div>

      {error && <p className="form-error text-red-400 text-sm m-0">{error}</p>}
      {success && <p className="success-message text-green-default text-sm">{success}</p>}

      {visibleCategories.map((category) => {
        const students = studentsByCategory[category.id] || []
        return (
          <section key={category.id} className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
            <div className="card-top flex justify-between items-start gap-4" style={{ marginBottom: '16px' }}>
              <h3>{category.name}</h3>
              <span className="chip neutral inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">{students.length} students</span>
            </div>
            {students.length === 0 ? (
              <p className="page-subtitle text-sm text-muted mt-1.5">No students in this category yet.</p>
            ) : (
              renderStudentList(students)
            )}
          </section>
        )
      })}

      {uncategorized.length > 0 && (
        <section key={NULL_CATEGORY_ID} className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <div className="card-top flex justify-between items-start gap-4" style={{ marginBottom: '16px' }}>
            <h3>Uncategorized</h3>
            <span className="chip neutral inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">{uncategorized.length} students</span>
          </div>
          {renderStudentList(uncategorized)}
        </section>
      )}

      {renderDeleteModal()}
    </div>
  )
}

export default AllStudents
