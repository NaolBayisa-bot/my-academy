import { useEffect, useState } from 'react'
import api from '../../api/axios'
import {
  ContentPage,
  PageHeader,
  Button,
  Field,
  Input,
  Select,
  Alert,
  Chip,
} from '../../components/ui'

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
  // Category id pending removal confirmation (inline confirm instead of
  // window.confirm, which is blocked/silent in embedded browsers & iframes).
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)

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
          setError(err.response?.data?.error || 'Failed to load categories.')
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
    setConfirmRemoveId(null)
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
      <ContentPage>
        <div className="panel-shell p-5 mb-6">
          <div className="text-sm text-muted text-center py-6">Loading categories...</div>
        </div>
      </ContentPage>
    )
  }

  // Error state (when no categories loaded)
  if (error && categories.length === 0) {
    return (
      <ContentPage>
        <Alert tone="error">{error}</Alert>
      </ContentPage>
    )
  }

  return (
    <ContentPage>
      <PageHeader
        eyebrow="Access control"
        title="Assign Category Admins"
        subtitle="Promote students to category administrators."
      />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {success && <Alert tone="success" className="mb-4">{success}</Alert>}

      <div className="flex flex-col gap-5">
        {categories.map((category) => {
          const admin = category.admin
          const busy = assigningId === category.id
          const studentsForCategory = filteredCandidates(category.id)
          const selected = selectedByCat[category.id] || ''

          return (
            <article key={category.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-base m-0">{category.name}</h3>
                </div>
                {admin ? (
                  <Chip variant="success" size="sm">Assigned</Chip>
                ) : (
                  <Chip variant="neutral" size="sm">Unassigned</Chip>
                )}
              </div>

              {/* Current admin */}
              <p className="text-sm text-muted m-0 mb-4">
                Current admin:{' '}
                <span className={`font-medium ${admin ? 'text-cyan-default' : ''}`}>
                  {adminLabel(admin)}
                </span>
              </p>

              {admin && (
                <div className="mb-4">
                  {confirmRemoveId === category.id ? (
                    <div className="alert alert-warning flex flex-wrap items-center gap-3">
                      <span className="flex-1">Remove {admin.name} as the admin for this category?</span>
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => handleDeassign(category)} disabled={busy}>
                          {busy ? 'Working...' : 'Yes, remove'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveId(null)} disabled={busy}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="danger" size="sm" onClick={() => setConfirmRemoveId(category.id)} disabled={busy}>
                      Remove Admin
                    </Button>
                  )}
                </div>
              )}

              {/* Assign a new admin */}
              <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                <Field label="Search" htmlFor={`search-${category.id}`}>
                  <Input
                    id={`search-${category.id}`}
                    type="search"
                    placeholder="Name or email..."
                    value={searchByCat[category.id] || ''}
                    onChange={(e) => setSearch(category.id, e.target.value)}
                    disabled={busy || candidatesLoading}
                  />
                </Field>

                <Field label="Available users" htmlFor={`select-${category.id}`}>
                  <Select
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
                  </Select>
                </Field>

                <Button
                  onClick={() => handleAssign(category)}
                  disabled={busy || !selected || studentsForCategory.length === 0 || candidatesLoading}
                >
                  {busy ? 'Assigning...' : 'Assign'}
                </Button>
              </div>

              {/* Empty State */}
              {!candidatesLoading && studentsForCategory.length === 0 && (
                <p className="text-sm text-muted m-0 mt-3">
                  No students available in this category.
                </p>
              )}
            </article>
          )
        })}
      </div>

      {/* No Categories State */}
      {categories.length === 0 && !error && (
        <div className="panel-shell p-5 mb-6">
          <p className="page-subtitle">No categories found.</p>
        </div>
      )}
    </ContentPage>
  )
}

export default AssignAdmins
