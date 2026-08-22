import { useEffect, useState } from 'react'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import FormField from '../../components/ui/FormField'
import DataTable from '../../components/ui/DataTable'

function AssignAdmins() {
  const [categories, setCategories] = useState([])
  const [studentsByCategory, setStudentsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  const [userActingId, setUserActingId] = useState(null)

  // Per-category transient UI state
  const [searchByCat, setSearchByCat] = useState({})
  const [selectedByCat, setSelectedByCat] = useState({})
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null)

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

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadCategories()
        await loadCandidates()
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
            'Failed to load data.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setCandidatesLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAssign = async (categoryId) => {
    setError(null)
    setSuccess(null)
    setAssigningId(categoryId)
    try {
      const userId = selectedByCat[categoryId]
      await api.patch('/admin/assign-category-admin', { userId, categoryId })
      await loadCategories()
      setSuccess('Admin assigned successfully.')
      setSelectedByCat((prev) => ({ ...prev, [categoryId]: '' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign admin.')
    } finally {
      setAssigningId(null)
    }
  }

  const handleDeassign = async (categoryId) => {
    setError(null)
    setSuccess(null)
    setAssigningId(categoryId)
    try {
      await api.patch('/admin/deassign-category-admin', { categoryId })
      await loadCategories()
      setSuccess('Admin removed successfully.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove admin.')
    } finally {
      setAssigningId(null)
      setShowRemoveConfirm(null)
    }
  }

  const openRemoveConfirm = (categoryId) => {
    setShowRemoveConfirm(categoryId)
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <p className="text-on-surface">Loading categories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <Alert variant="error" message={error} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">
          Assign Category Admins
        </h1>

        {success && <Alert variant="success" message={success} className="mb-4" />}

        {categories.length === 0 && <EmptyState icon="admin_panel_settings" title="No categories found." />}

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
              <Card key={category.id}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-on-surface">{category.name}</h3>

                  {category.admin ? (
                    <div className="text-right">
                      <p className="text-sm text-on-surface">
                        <strong className="text-on-surface">{category.admin.name}</strong>
                        <br />
                        <span className="text-on-surface-variant text-xs">{category.admin.email}</span>
                      </p>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openRemoveConfirm(category.id)}
                        disabled={busy}
                      >
                        Remove admin
                      </Button>
                    </div>
                  ) : (
                    <EmptyState icon="person_add" title="— None assigned" />
                  )}
                </div>

                {!category.admin && (
                  <div className="space-y-3">
                    <FormField
                      type="search"
                      placeholder="Search by name or email..."
                      value={searchByCat[category.id] || ''}
                      onChange={(e) => setSearch(category.id, e.target.value)}
                      disabled={busy || studentsForCategory.length === 0}
                    />

                    <select
                      value={selectedByCat[category.id] || ''}
                      onChange={(e) => setSelected(category.id, e.target.value)}
                      disabled={busy || studentsForCategory.length === 0}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>-- Select a user --</option>
                      {filtered.length === 0 ? (
                        <option value="" disabled>No matching students</option>
                      ) : (
                        filtered.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name} ({candidate.email})
                          </option>
                        ))
                      )}
                    </select>

                    <Button
                      variant="primary"
                      onClick={() => handleAssign(category.id)}
                      disabled={busy || !selectedByCat[category.id] || studentsForCategory.length === 0}
                      fullWidth
                    >
                      {busy ? 'Assigning...' : 'Assign'}
                    </Button>

                    {studentsForCategory.length === 0 && !candidatesLoading && (
                      <p className="text-xs text-on-surface-muted mt-2">
                        No students in this category to assign as an admin.
                      </p>
                    )}
                  </div>
                )}

                {studentsForCategory.length > 0 && studentsForCategory.length === filtered.length &&
                  !category.admin && (
                    <p className="text-xs text-on-surface-muted mt-2">
                      Showing all {studentsForCategory.length} available student{studentsForCategory.length !== 1 ? 's' : ''}
                    </p>
                  )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Remove Admin Confirmation Modal */}
      <Modal
        isOpen={showRemoveConfirm !== null}
        onClose={() => setShowRemoveConfirm(null)}
        title="Remove Admin"
      >
        <p className="text-on-surface mb-4">
          Are you sure you want to remove the admin from{" "}
          <strong className="text-on-surface">
            {categories.find((c) => c.id === showRemoveConfirm)?.name}
          </strong>
          ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowRemoveConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDeassign(showRemoveConfirm)} loading={assigningId === showRemoveConfirm}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AssignAdmins
