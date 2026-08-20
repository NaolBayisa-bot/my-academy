import { useEffect, useState } from 'react'
import api from '../../api/axios'

// Super admin page: assign a category admin to each category.
//
// Data flow:
//  - GET /api/categories                  -> the categories, each with its
//                                           current admin (Category.admin, null
//                                           when unassigned).
//  - GET /api/admin/students              -> students grouped by category
//                                           (studentsByCategory). Each
//                                           category's picker is scoped to that
//                                           category's own students, so an admin
//                                           is always promoted from the
//                                           category they will administer.
//                                           (There is no global user-list
//                                           endpoint, so existing category
//                                           admins are not offered as
//                                           re-assignable picks.)
//  - PATCH /api/admin/assign-category-admin -> { userId, categoryId }
//
// After a successful assignment a confirmation is shown and both lists are
// refetched so the newly-assigned admin appears under its category and leaves
// the student picker. Backend validation errors (e.g. trying to assign a user
// who is already a super_admin) are surfaced verbatim in the message below.
function AssignAdmins() {
  const [categories, setCategories] = useState([])
  const [studentsByCategory, setStudentsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  // Busy state for the per-admin user-management actions (suspend/activate/delete).
  const [userActingId, setUserActingId] = useState(null)

  // Per-category transient UI state, keyed by category id so the searchable
  // dropdown + selection are tracked independently for each card.
  const [searchByCat, setSearchByCat] = useState({})
  const [selectedByCat, setSelectedByCat] = useState({})

  const setSearch = (categoryId, value) =>
    setSearchByCat((prev) => ({ ...prev, [categoryId]: value }))
  const setSelected = (categoryId, value) =>
    setSelectedByCat((prev) => ({ ...prev, [categoryId]: value }))

  const loadCategories = async () => {
    const res = await api.get('/categories')
    setCategories(res.data.categories)
  }

  const loadCandidates = async () => {
    const res = await api.get('/admin/students')
    const grouped = res.data.studentsByCategory || {}
    // Keep students grouped by their category so each category's picker only
    // ever offers students from that category.
    const normalized = {}
    Object.entries(grouped).forEach(([categoryId, students]) => {
      normalized[categoryId] = students.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
      }))
    })
    setStudentsByCategory(normalized)
  }

  // Categories are required to render the page.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadCategories()
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
              'Failed to load categories. Please try again.'
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
  }, [])

  // Load candidates once.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadCandidates()
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
              'Failed to load students. Please try again.'
          )
        }
      } finally {
        if (!cancelled) setCandidatesLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Runs a user-management action (suspend/activate/delete) for a student
  // and then refreshes the lists so the UI reflects the change immediately.
  const runAction = async (student, fn) => {
    setUserActingId(student.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await fn()
      setSuccess(res?.data?.message || 'Action completed.')
      await loadCandidates()
    } catch (err) {
      setError(
        err.response?.data?.error || 'Action failed. Please try again.'
      )
    } finally {
      setUserActingId(null)
    }
  }

  const handleSuspend = (student) =>
    runAction(student, () => api.patch(`/admin/users/${student.id}/suspend`))

  const handleActivate = (student) =>
    runAction(student, () => api.patch(`/admin/users/${student.id}/activate`))

  const handleDeleteUser = (student) =>
    runAction(student, () => api.delete(`/admin/users/${student.id}`))

  const handleAssign = async (category) => {
    const userId = selectedByCat[category.id]
    if (!userId) return

    setAssigningId(category.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.patch('/admin/assign-category-admin', {
        userId,
        categoryId: category.id,
      })
      setSuccess(res?.data?.message || 'Admin assigned successfully.')
      // Remove the category from the list after assignment.
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
      setSelectedByCat((prev) => {
        const { [category.id]: _, ...rest } = prev
        return rest
      })
      setSearchByCat((prev) => {
        const { [category.id]: _, ...rest } = prev
        return rest
      })
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to assign admin. Please try again.'
      )
    } finally {
      setAssigningId(null)
    }
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
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Assign Category Admins</h1>

      {success && (
        <p
          role="status"
          className="mb-4 p-3 text-green-700 bg-green-900/20 border border-green-500 rounded-lg"
        >
          {success}
        </p>
      )}

      {categories.length === 0 && !loading && !error && (
        <p className="text-slate-400">All categories have an admin assigned.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const busy = assigningId === category.id
          const studentsForCategory = studentsByCategory[category.id] || []
          const filtered = studentsForCategory.filter(
            (student) =>
              student.name.toLowerCase().includes(searchByCat[category.id]?.toLowerCase() || '') ||
              student.email.toLowerCase().includes(searchByCat[category.id]?.toLowerCase() || '')
          )

          return (
            <div
              key={category.id}
              className="bg-glass border border-glass-border rounded-xl shadow-glass p-6"
            >
              <h3 className="text-xl font-semibold mb-4 text-violet-400">{category.name}</h3>

              <div className="space-y-3">
                <div>
                  <label htmlFor={`search-${category.id}`} className="block text-sm font-medium text-slate-300 mb-1">
                    Assign an admin
                  </label>
                  <input
                    id={`search-${category.id}`}
                    type="search"
                    placeholder="Search by name or email..."
                    value={searchByCat[category.id] || ''}
                    onChange={(e) => setSearch(category.id, e.target.value)}
                    disabled={busy || studentsForCategory.length === 0}
                    className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <select
                  value={selectedByCat[category.id] || ''}
                  onChange={(e) => setSelected(category.id, e.target.value)}
                  disabled={busy || studentsForCategory.length === 0}
                  className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="" disabled>
                    {studentsForCategory.length === 0
                      ? '— No students —'
                      : '-- Select a user --'}
                  </option>
                  {filtered.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} ({candidate.email})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleAssign(category)}
                  disabled={busy || !selectedByCat[category.id] || studentsForCategory.length === 0}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet disabled:opacity-50"
                >
                  {busy ? 'Assigning...' : 'Assign'}
                </button>

                {!candidatesLoading && studentsForCategory.length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    No students in this category to assign as an admin.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AssignAdmins
