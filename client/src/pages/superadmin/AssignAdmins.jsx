import { useEffect, useState } from 'react'
import api from '../../api/axios'

// Super admin page: assign a category admin to each category.
//
// Data flow:
//   - GET /api/categories                  -> the categories, each with its
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
//  - PATCH /api/admin/deassign-category-admin -> { categoryId }
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

  // Candidates are non-blocking: the page still works (and renders the
  // categories + their current admins) without them.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadCandidates()
      } catch {
        // Non-blocking — the picker just stays empty.
      } finally {
        if (!cancelled) setCandidatesLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredCandidates = (categoryId) => {
    const query = (searchByCat[categoryId] || '').toLowerCase()
    const pool = studentsByCategory[categoryId] || []
    if (!query) return pool
    return pool.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query)
    )
  }

  const handleDeassign = async (category) => {
    if (!category.admin) return
    setError(null)
    setSuccess(null)
    setAssigningId(category.id)
    try {
      const res = await api.patch('/admin/deassign-category-admin', {
        categoryId: category.id,
      })
      setSuccess(res.data.message || 'Category admin de-assigned.')
      await Promise.all([loadCategories(), loadCandidates()])
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to de-assign admin. Please try again.'
      )
    } finally {
      setAssigningId(null)
    }
  }

  const handleAssign = async (category) => {
    const userId = selectedByCat[category.id]
    if (!userId) {
      setError('Please select a user to assign as the category admin.')
      return
    }

    setError(null)
    setSuccess(null)
    setAssigningId(category.id)
    try {
      const res = await api.patch('/admin/assign-category-admin', {
        userId,
        categoryId: category.id,
      })
      setSuccess(res.data.message || 'User assigned as category admin.')
      setSelected(category.id, '')
      // Refresh every category (to pick up the new admin) and the candidate
      // lists (the assigned user leaves their category's student pool).
      await Promise.all([loadCategories(), loadCandidates()])
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to assign admin. Please try again.'
      )
    } finally {
      setAssigningId(null)
    }
  }

  const adminLabel = (admin) =>
    admin ? `${admin.name} (${admin.email})` : '— None assigned —'

  // Loading state
  if (loading) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <div className="text-muted text-sm text-center py-6">Loading categories...</div>
        </div>
      </div>
    )
  }

  // Error state (when no categories loaded)
  if (error && categories.length === 0) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p className="form-error text-red-400 text-sm m-0">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      {/* Page Header */}
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Access control</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Assign Category Admins</h1>
          <p className="page-subtitle text-sm text-muted mt-1.5 m-0">
            Promote students to category administrators.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="form-error text-red-400 text-sm m-0 mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="success-message text-green-default text-sm m-0 mb-4 rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2">
          {success}
        </div>
      )}

      {/* Categories Grid */}
      <div className="flex flex-col gap-5">
        {categories.map((category) => {
          const admin = category.admin
          const busy = assigningId === category.id
          const studentsForCategory = filteredCandidates(category.id)
          const selected = selectedByCat[category.id] || ''

          return (
            <article
              key={category.id}
              className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-4 transition-colors duration-200 hover:border-cyan-default/25"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0">Category</p>
                  <h3 className="text-lg font-bold m-0">{category.name}</h3>
                </div>
                {admin ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default shrink-0">
                    Assigned
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted shrink-0">
                    Unassigned
                  </span>
                )}
              </div>

              {/* Current Admin Section */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(143,170,205,0.1)] bg-[rgba(9,17,27,0.5)] px-4 py-3">
                <div className="info-block flex flex-col gap-1 min-w-0">
                  <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Current admin</span>
                  <p className={`m-0 text-sm truncate ${admin ? 'font-medium' : 'text-muted italic'}`}>
                    {adminLabel(admin)}
                  </p>
                </div>

                {/* Remove Admin Button */}
                {admin && (
                  <button
                    type="button"
                    className="danger-btn small shrink-0 inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-3.5 py-2 text-sm rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove ${admin.name} as admin of "${category.name}"?`
                        )
                      ) {
                        handleDeassign(category)
                      }
                    }}
                    disabled={busy}
                    title="Remove admin"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Assign New Admin Section */}
              <div className="pt-4 border-t border-[rgba(143,170,205,0.1)] mt-auto flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider m-0">Assign new admin</h4>

                <div className="grid gap-4">
                  {/* Search Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor={`search-${category.id}`}>Search</label>
                    <input
                      id={`search-${category.id}`}
                      type="search"
                      placeholder="Name or email..."
                      value={searchByCat[category.id] || ''}
                      onChange={(e) => setSearch(category.id, e.target.value)}
                      disabled={busy || candidatesLoading}
                      className="w-full bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.14)] rounded-xl px-3.5 py-2.5 text-sm placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-cyan-default/50 focus:border-cyan-default/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Student Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor={`select-${category.id}`}>Available users</label>
                    <select
                      id={`select-${category.id}`}
                      value={selected}
                      onChange={(e) => setSelected(category.id, e.target.value)}
                      disabled={busy || studentsForCategory.length === 0 || candidatesLoading}
                      className="field-select w-full bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.14)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-default/50 focus:border-cyan-default/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0d1623]"
                    >
                      <option value="" disabled>
                        {studentsForCategory.length === 0
                          ? '— No students available —'
                          : '-- Select a user --'}
                      </option>
                      {studentsForCategory.length > 0 &&
                        studentsForCategory.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name} ({candidate.email})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Assign Button */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                      onClick={() => handleAssign(category)}
                      disabled={busy || !selected || studentsForCategory.length === 0 || candidatesLoading}
                    >
                      {busy ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {!candidatesLoading && studentsForCategory.length === 0 && (
                  <p className="muted-copy text-sm text-muted m-0">
                    No students available in this category.
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* No Categories State */}
      {categories.length === 0 && !error && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p className="page-subtitle text-sm text-muted mt-1.5">No categories found.</p>
        </div>
      )}
    </div>
  )
}

export default AssignAdmins
