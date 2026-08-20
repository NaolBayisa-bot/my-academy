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
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Email</th>
          <th style={thStyle}>Current Course</th>
          <th style={thStyle}>Enrollment Status</th>
          <th style={thStyle}>Account Status</th>
          {isSuperAdmin && <th style={thStyle}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td style={tdStyle}>{student.name}</td>
            <td style={tdStyle}>{student.email}</td>
            <td style={tdStyle}>
              {student.currentEnrollment?.course?.title || '—'}
            </td>
            <td style={tdStyle}>
              {student.currentEnrollment?.status || 'none'}
            </td>
            <td style={tdStyle}>
              <span
                style={
                  student.status === 'suspended'
                    ? suspendedBadgeStyle
                    : activeBadgeStyle
                }
              >
                {student.status === 'suspended' ? 'Suspended' : 'Active'}
              </span>
            </td>
            {isSuperAdmin && (
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {student.status === 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => handleActivate(student)}
                      disabled={actingId === student.id}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSuspend(student)}
                      disabled={actingId === student.id}
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
  )

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  return (
    <div>
      <h1>{isSuperAdmin ? 'All Students' : 'My Students'}</h1>

      {actionSuccess && (
        <p role="status" style={successStyle}>
          {actionSuccess}
        </p>
      )}
      {actionError && <p style={{ color: 'red' }}>{actionError}</p>}

      {visibleCategories.map((category) => {
        const students = studentsByCategory[category.id] || []
        return (
          <section key={category.id} style={{ marginBottom: '28px' }}>
            <h2 style={sectionTitleStyle}>{category.name}</h2>
            {students.length === 0 ? (
              <p style={{ color: '#666' }}>
                No students in this category yet.
              </p>
            ) : (
              renderStudentTable(students)
            )}
          </section>
        )
      })}

      {uncategorized.length > 0 && (
        <section key={NULL_CATEGORY_ID} style={{ marginBottom: '28px' }}>
          <h2 style={sectionTitleStyle}>Uncategorized</h2>
          {renderStudentTable(uncategorized)}
        </section>
      )}
    </div>
  )
}

const tableStyle = {
  borderCollapse: 'collapse',
  width: '100%',
  maxWidth: '840px',
}

const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'left',
  background: '#f5f5f5',
}

const tdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
}

const sectionTitleStyle = {
  borderBottom: '1px solid #ccc',
  paddingBottom: '4px',
}

const successStyle = {
  color: 'green',
  background: '#e8f5e9',
  border: '1px solid #66bb6a',
  borderRadius: '6px',
  padding: '10px 12px',
  maxWidth: '720px',
}

const activeBadgeStyle = {
  color: '#2e7d32',
  fontWeight: 'bold',
}

const suspendedBadgeStyle = {
  color: '#b26a00',
  fontWeight: 'bold',
}

export default AllStudents
