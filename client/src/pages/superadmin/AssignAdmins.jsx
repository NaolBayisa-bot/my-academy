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
      <div className="content-page">
        <div className="section-shell">
          <div className="loading-center">Loading categories...</div>
        </div>
      </div>
    )
  }

  // Error state (when no categories loaded)
  if (error && categories.length === 0) {
    return (
      <div className="content-page">
        <div className="section-shell">
          <p className="form-error">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Assign Category Admins</h1>
          <p className="page-subtitle">
            Promote students to category administrators. Only super admins can perform this action.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="form-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="success-message" style={{ marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {/* Categories Grid */}
      <div className="category-admin-grid">
        {categories.map((category) => {
          const admin = category.admin
          const busy = assigningId === category.id
          const studentsForCategory = filteredCandidates(category.id)
          const selected = selectedByCat[category.id] || ''

          return (
            <article key={category.id} className="admin-category-card">
              {/* Category Header */}
              <div className="card-header">
                <div className="category-info">
                  <p className="eyebrow">Category</p>
                  <h3 className="category-name">{category.name}</h3>
                </div>
                <span className={`chip ${admin ? 'success' : 'neutral'}`}>
                  {admin ? 'Assigned' : 'Unassigned'}
                </span>
              </div>

              {/* Current Admin Section */}
              <div className="admin-section">
                <div className="info-block">
                  <span className="muted-label">Current admin</span>
                  <p className="current-admin-text">
                    {adminLabel(admin)}
                  </p>
                </div>

                {/* Remove Admin Button */}
                {admin && (
                  <div className="admin-actions">
                    <span className="admin-badge">{admin.name}</span>
                    <button
                      type="button"
                      className="danger-btn small"
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
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Assign New Admin Section */}
              <div className="form-section">
                <h4 className="form-section-title">Assign new admin</h4>

                <div className="form-grid">
                  {/* Search Input */}
                  <div className="field">
                    <label htmlFor={`search-${category.id}`}>Search</label>
                    <input
                      id={`search-${category.id}`}
                      type="search"
                      placeholder="Name or email..."
                      value={searchByCat[category.id] || ''}
                      onChange={(e) => setSearch(category.id, e.target.value)}
                      disabled={busy || candidatesLoading}
                    />
                  </div>

                  {/* Student Selector */}
                  <div className="field">
                    <label htmlFor={`select-${category.id}`}>Available users</label>
                    <select
                      id={`select-${category.id}`}
                      value={selected}
                      onChange={(e) => setSelected(category.id, e.target.value)}
                      disabled={busy || studentsForCategory.length === 0 || candidatesLoading}
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
                  <div className="button-row">
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => handleAssign(category)}
                      disabled={busy || !selected || studentsForCategory.length === 0 || candidatesLoading}
                    >
                      {busy ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {!candidatesLoading && studentsForCategory.length === 0 && (
                  <p className="muted-copy">
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
        <div className="section-shell">
          <p className="page-subtitle">No categories found.</p>
        </div>
      )}
    </div>
  )
}

export default AssignAdmins
