import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// Students overview page shared by two roles:
//  - super_admin     -> every category, each section listing that category's
//                       students (GET /api/admin/students, grouped).
//  - category_admin  -> only the admin's own category, listing just those
//                       students (GET /api/admin/category/:id/students).
//
// Read-only: no actions are exposed on this page.
const NULL_CATEGORY_ID = '00000000-0000-0000-0000-000000000000'

function AllStudents() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [categories, setCategories] = useState([])
  const [studentsByCategory, setStudentsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [actingId, setActingId] = useState(null)

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

  // Runs a user-management action (suspend/activate/delete) and then refreshes
  // the student list so the UI reflects the change immediately.
  const runAction = async (student, fn) => {
    setActingId(student.id)
    setActionError(null)
    setActionSuccess(null)
    try {
      const res = await fn()
      setActionSuccess(res?.data?.message || 'Action completed.')
      await loadStudents()
    } catch (err) {
      setActionError(
        err.response?.data?.error || 'Action failed. Please try again.'
      )
    } finally {
      setActingId(null)
    }
  }

  const handleSuspend = (student) =>
    runAction(student, () => api.patch(`/admin/users/${student.id}/suspend`))

  const handleActivate = (student) =>
    runAction(student, () => api.patch(`/admin/users/${student.id}/activate`))

  const handleDeleteUser = (student) =>
    runAction(student, () => api.delete(`/admin/users/${student.id}`))

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

  // Categories that get their own section: all of them for a super_admin,
  // only the admin's own category otherwise.
  const visibleCategories = isSuperAdmin
    ? categories
    : categories.filter((category) => category.id === user?.category_id)

  const uncategorized = isSuperAdmin
    ? studentsByCategory[NULL_CATEGORY_ID] || []
    : []

  const renderStudentTable = (students) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-glass border border-glass-border rounded-xl">
        <thead>
          <tr className="bg-slate-800/50">
            <th className="px-4 py-3 text-left text-slate-300 font-medium">Name</th>
            <th className="px-4 py-3 text-left text-slate-300 font-medium">Email</th>
            <th className="px-4 py-3 text-left text-slate-300 font-medium">Current Course</th>
            <th className="px-4 py-3 text-left text-slate-300 font-medium">Enrollment Status</th>
            <th className="px-4 py-3 text-left text-slate-300 font-medium">Account Status</th>
            {isSuperAdmin && <th className="px-4 py-3 text-left text-slate-300 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-t border-glass-border">
              <td className="px-4 py-3 text-slate-100">{student.name}</td>
              <td className="px-4 py-3 text-slate-300">{student.email}</td>
              <td className="px-4 py-3 text-slate-300">
                {student.currentEnrollment?.course?.title || '—'}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {student.currentEnrollment?.status || 'none'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.status === 'suspended'
                      ? 'text-yellow-600 bg-yellow-900/20'
                      : 'text-green-600 bg-green-900/20'
                  }`}
                >
                  {student.status === 'suspended' ? 'Suspended' : 'Active'}
                </span>
              </td>
              {isSuperAdmin && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {student.status === 'suspended' ? (
                      <button
                        type="button"
                        onClick={() => handleActivate(student)}
                        disabled={actingId === student.id}
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-900/20 rounded transition-violet disabled:opacity-50"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSuspend(student)}
                        disabled={actingId === student.id}
                        className="px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-900/20 rounded transition-violet disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actingId === student.id}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Permanently delete ${student.name} (${student.email})? This removes their account and any data tied to it. This cannot be undone.`
                          )
                        ) {
                          handleDeleteUser(student)
                        }
                      }}
                      className="px-3 py-1 text-sm text-red-500 hover:bg-red-900/20 rounded transition-violet disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

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
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">
        {isSuperAdmin ? 'All Students' : 'My Students'}
      </h1>

      {actionSuccess && (
        <p
          role="status"
          className="mb-4 p-3 text-green-700 bg-green-900/20 border border-green-500 rounded-lg"
        >
          {actionSuccess}
        </p>
      )}
      {actionError && <p className="mb-4 text-red-500">{actionError}</p>}

      {visibleCategories.map((category) => {
        const students = studentsByCategory[category.id] || []
        return (
          <section key={category.id} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-violet-400 border-b border-glass-border pb-2">
              {category.name}
            </h2>
            {students.length === 0 ? (
              <p className="text-slate-500">No students in this category yet.</p>
            ) : (
              renderStudentTable(students)
            )}
          </section>
        )
      })}

      {uncategorized.length > 0 && (
        <section key={NULL_CATEGORY_ID} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-violet-400 border-b border-glass-border pb-2">
            Uncategorized
          </h2>
          {renderStudentTable(uncategorized)}
        </section>
      )}
    </div>
  )
}

export default AllStudents
