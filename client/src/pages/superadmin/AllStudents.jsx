import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// Students overview page shared by two roles:
//  - super_admin     -> every category, each section listing that category's
//                      students (GET /api/admin/students, grouped), with
//                      suspend/unsuspend/delete actions.
//  - category_admin  -> only the admin's own category, listing those students
//                      (GET /api/admin/category/:id/students) with a live
//                      per-student progress column (read-only).

const NULL_CATEGORY_ID = '00000000-0000-0000-0000-000000000000'

const STATUS_LABELS = {
  pending: 'Pending approval',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

// Sort so students needing attention (pending, then active) surface first.
const STATUS_RANK = { pending: 0, in_progress: 1, completed: 2, rejected: 3 }

function SkeletonBlock({ className }) {
  return <div className={'rounded bg-[rgba(148,175,211,0.15)] animate-shimmer ' + (className || '')} />
}

function StudentsSkeleton({ rows }) {
  const count = rows || 4
  const arr = Array.from({ length: count })
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading students">
      {arr.map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <SkeletonBlock className="h-9 w-9 rounded-full shrink-0" />
          <SkeletonBlock className="h-4 flex-1 max-w-[160px]" />
          <SkeletonBlock className="h-3 flex-1" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

function statusChip(status) {
  const map = {
    completed: 'bg-green-soft text-green-default border-green-default/30',
    pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    rejected: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    in_progress: 'bg-cyan-soft text-cyan-default border-cyan-default/30',
  }
  const text = STATUS_LABELS[status] || 'No enrollment'
  return (
    <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap border ' + (map[status] || 'bg-[rgba(148,175,211,0.12)] text-muted border-[rgba(143,170,205,0.18)]')}>
      {text}
    </span>
  )
}

// Mini progress bar for the category admin's per-student progress column.
function MiniProgress({ pct }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct || 0)))
  return (
    <div
      className="flex items-center gap-2 min-w-[130px]"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={'Course progress ' + clamped + '%'}
    >
      <div className="h-2 flex-1 rounded-full bg-[rgba(15,27,40,0.9)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-500"
          style={{ width: clamped + '%' }}
        />
      </div>
      <span className="text-xs font-bold w-9 text-right shrink-0">{clamped}%</span>
    </div>
  )
}

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
  const [query, setQuery] = useState('')

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

  const handleSuspend = async (studentId, studentName) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.patch(`/admin/students/${studentId}/suspend`)
      setSuccess(`Student "${studentName}" has been suspended.`)
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
      await loadStudents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unsuspend student.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (studentId, studentName) => {
    if (!studentToDelete) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.delete(`/admin/students/${studentId}`)
      setSuccess(`Student "${studentName}" has been deleted.`)
      setStudentToDelete(null)
      await loadStudents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete student.')
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDelete = (student) => setStudentToDelete(student)
  const cancelDelete = () => {
    if (!actionLoading) setStudentToDelete(null)
  }

  const visibleCategories = isSuperAdmin
    ? categories
    : categories.filter((category) => category.id === user?.category_id)

  const uncategorized = isSuperAdmin
    ? studentsByCategory[NULL_CATEGORY_ID] || []
    : []

  // Filter + sort a category's students. For category_admin, surface students
  // needing attention (pending / active / least progress) first.
  const processStudents = (students) => {
    const q = query.trim().toLowerCase()
    let list = students
    if (q) {
      list = students.filter((s) => {
        const course = s.currentEnrollment?.course?.title || ''
        return (
          (s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          course.toLowerCase().includes(q)
        )
      })
    }
    return list.slice().sort((a, b) => {
      const rankA = STATUS_RANK[a.currentEnrollment?.status] ?? 4
      const rankB = STATUS_RANK[b.currentEnrollment?.status] ?? 4
      if (rankA !== rankB) return rankA - rankB
      return (a.currentEnrollment?.progressPct ?? 0) - (b.currentEnrollment?.progressPct ?? 0)
    })
  }

  const renderStudentList = (students) => {
    const list = processStudents(students)
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 text-center py-6">
          <span className="text-3xl" aria-hidden="true">🔍</span>
          <p className="text-sm text-muted m-0">No students match your search.</p>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="font-semibold py-2 pr-4">Student</th>
              <th scope="col" className="font-semibold py-2 pr-4">Email</th>
              <th scope="col" className="font-semibold py-2 pr-4">Course</th>
              {!isSuperAdmin && <th scope="col" className="font-semibold py-2 pr-4">Progress</th>}
              <th scope="col" className="font-semibold py-2 pr-4">Status</th>
              {isSuperAdmin && <th scope="col" className="font-semibold py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((student) => {
              const ce = student.currentEnrollment
              const isActiveProgress = ce && (ce.status === 'in_progress' || ce.status === 'completed')
              return (
                <tr key={student.id} className="border-t border-[rgba(143,170,205,0.08)] hover:bg-[rgba(15,27,40,0.4)] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-default to-purple font-black text-[#02131f] grid place-items-center text-xs">
                        {(student.name?.charAt(0)?.toUpperCase() || 'S')}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium block truncate">{student.name}</span>
                        {student.suspended && (
                          <span className="text-[11px] font-semibold text-red-300">Suspended</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted truncate max-w-[220px]">{student.email}</td>
                  <td className="py-3 pr-4 text-muted">{ce?.course?.title || '—'}</td>
                  {!isSuperAdmin && (
                    <td className="py-3 pr-4">
                      {isActiveProgress ? (
                        <MiniProgress pct={ce.progressPct} />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 pr-4">{statusChip(ce?.status)}</td>
                  {isSuperAdmin && (
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {student.suspended ? (
                          <button
                            type="button"
                            className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-3 py-2 rounded-lg text-xs hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            onClick={() => handleUnsuspend(student.id, student.name)}
                            disabled={actionLoading}
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-3 py-2 rounded-lg text-xs hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            onClick={() => handleSuspend(student.id, student.name)}
                            disabled={actionLoading}
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          type="button"
                          className="danger-btn inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-3 py-2 rounded-lg text-xs hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          onClick={() => confirmDelete(student)}
                          disabled={actionLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const myStudents = isSuperAdmin ? [] : studentsByCategory[user?.category_id] || []
  const activeCount = myStudents.filter((s) => s.currentEnrollment?.status === 'in_progress').length
  const pendingCount = myStudents.filter((s) => s.currentEnrollment?.status === 'pending').length
  const doneCount = myStudents.filter((s) => s.currentEnrollment?.status === 'completed').length

  if (loading) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5">
          <StudentsSkeleton rows={5} />
        </div>
      </div>
    )
  }

  if (error) {
    return <p className="form-error text-red-400 text-sm m-0">{error}</p>
  }

  const renderDeleteModal = () => {
    if (!studentToDelete) return null
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
        <div className="rounded-2xl border border-[rgba(143,170,205,0.16)] bg-[#0a1524] p-6 max-w-sm w-full">
          <h3 className="text-lg font-bold m-0 mb-2">Delete student?</h3>
          <p className="text-sm text-muted m-0 mb-6">
            This will permanently remove <strong>{studentToDelete.name}</strong> and all their
            enrollments and progress. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              onClick={cancelDelete}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="danger-btn inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              onClick={() => handleDelete(studentToDelete.id, studentToDelete.name)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Student'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <header className="animate-fade-up">
        <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">
          {isSuperAdmin ? 'Learners' : 'My category'}
        </p>
        <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">
          {isSuperAdmin ? 'All Students' : 'My Students'}
        </h1>
        <p className="page-subtitle text-sm text-muted mt-1.5">
          {isSuperAdmin
            ? 'Review all learners, manage suspensions, and delete inactive accounts.'
            : 'Review active learners and their course progress at a glance.'}
        </p>

        {!isSuperAdmin && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-soft text-cyan-default border border-cyan-default/25">👥 {myStudents.length} students</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-soft text-green-default border border-green-default/25">📈 {activeCount} active</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/25">⏳ {pendingCount} pending</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple border border-purple/25">🎓 {doneCount} completed</span>
          </div>
        )}
      </header>

      {!isSuperAdmin && myStudents.length > 0 && (
        <div className="mt-4">
          <input
            type="search"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Search by name, email or course…"
            aria-label="Search students"
            className="w-full max-w-sm text-sm bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.18)] rounded-xl px-3 py-2 outline-none focus:border-cyan-default/50 placeholder:text-muted"
          />
        </div>
      )}

      {error && <p className="form-error text-red-400 text-sm m-0">{error}</p>}
      {success && (
        <div className="rounded-lg border border-green-default/25 bg-green-soft px-3 py-2 text-sm text-green-default my-4">{success}</div>
      )}

      {visibleCategories.map((category) => {
        const students = studentsByCategory[category.id] || []
        return (
          <section key={category.id} className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 mt-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-base font-bold m-0">{category.name}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">{students.length} students</span>
            </div>
            {students.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-center py-8">
                <span className="text-3xl" aria-hidden="true">👤</span>
                <p className="text-sm text-muted m-0">No students in this category yet.</p>
              </div>
            ) : (
              renderStudentList(students)
            )}
          </section>
        )
      })}

      {uncategorized.length > 0 && (
        <section key={NULL_CATEGORY_ID} className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 mt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-base font-bold m-0">Uncategorized</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">{uncategorized.length} students</span>
          </div>
          {renderStudentList(uncategorized)}
        </section>
      )}

      {renderDeleteModal()}
    </div>
  )
}

export default AllStudents
