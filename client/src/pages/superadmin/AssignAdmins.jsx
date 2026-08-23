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
    admin ? `${admin.name} (${admin.email})` : '— None assigned'

  if (loading) {
    return <div>Loading...</div>
  }

  if (error && categories.length === 0) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  return (
    <div>
      <h1>Assign Category Admins</h1>

      {success && (
        <p role="status" style={successStyle}>
          {success}
        </p>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={gridStyle}>
        {categories.map((category) => {
          const admin = category.admin || null
          const busy = assigningId === category.id
          const selected = selectedByCat[category.id] || ''
          const studentsForCategory = studentsByCategory[category.id] || []
          const filtered = filteredCandidates(category.id)

          return (
            <div key={category.id} style={cardStyle}>
              <h3 style={{ marginTop: '0' }}>{category.name}</h3>
              <p>
                <span style={{ fontWeight: 'bold' }}>Current admin:</span>{' '}
                {admin ? (
                  <strong>{adminLabel(admin)}</strong>
                ) : (
                  <em>{adminLabel(admin)}</em>
                )}
              </p>

              {admin && (
                <button
                  type="button"
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
                  style={{ ...buttonStyle, fontSize: '12px', padding: '4px 10px' }}
                >
                  Remove admin
                </button>
              )}
              <div style={{ marginTop: '12px' }}>
                <label htmlFor={`search-${category.id}`} style={labelStyle}>
                  Assign an admin
                </label>
                <input
                  id={`search-${category.id}`}
                  type="search"
                  placeholder="Search by name or email..."
                  value={searchByCat[category.id] || ''}
                  onChange={(e) => setSearch(category.id, e.target.value)}
                  disabled={busy}
                  style={searchInputStyle}
                />
                <select
                  value={selected}
                  onChange={(e) => setSelected(category.id, e.target.value)}
                  disabled={busy || studentsForCategory.length === 0}
                  style={selectStyle}
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
                  disabled={busy || !selected || studentsForCategory.length === 0}
                  style={{ ...buttonStyle, marginLeft: '8px' }}
                >
                  {busy ? 'Assigning…' : 'Assign'}
                </button>

                {!candidatesLoading && studentsForCategory.length === 0 && (
                  <p
                    style={{
                      color: '#666',
                      fontSize: '13px',
                      marginTop: '8px',
                    }}
                  >
                    No students in this category to assign as an admin.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {categories.length === 0 && !loading && !error && (
        <p>No categories found.</p>
      )}
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '16px',
  marginTop: '16px',
}

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '16px',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 'bold',
  marginBottom: '4px',
}

const searchInputStyle = {
  display: 'block',
  width: '100%',
  marginBottom: '8px',
  padding: '6px 8px',
}

const selectStyle = {
  width: '100%',
  padding: '6px 8px',
}

const buttonStyle = {
  marginTop: '8px',
  padding: '6px 12px',
  cursor: 'pointer',
}

const successStyle = {
  color: 'green',
  background: '#e8f5e9',
  border: '1px solid #66bb6a',
  borderRadius: '6px',
  padding: '10px 12px',
  maxWidth: '720px',
}

export default AssignAdmins
