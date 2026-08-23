import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

function ManageCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add form state
  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addDescription, setAddDescription] = useState('')

  // Edit form state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const loadCourses = async () => {
    const res = await api.get('/courses', {
      params: { categoryId: user.category_id },
    })
    setCourses(res.data.courses)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/courses', {
          params: { categoryId: user.category_id },
        })
        if (!cancelled) setCourses(res.data.courses)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load courses.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.category_id])

  const clearError = () => setError(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await api.post('/courses', {
        category_id: user.category_id,
        title: addTitle,
        description: addDescription,
      })
      setAddTitle('')
      setAddDescription('')
      setShowAdd(false)
      await loadCourses()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add course.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (course) => {
    setEditingId(course.id)
    setEditTitle(course.title)
    setEditDescription(course.description || '')
    clearError()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleUpdate = async (e, courseId) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await api.patch(`/courses/${courseId}`, {
        title: editTitle,
        description: editDescription,
      })
      cancelEdit()
      await loadCourses()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update course.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (courseId) => {
    clearError()
    setSubmitting(true)
    try {
      await api.delete(`/courses/${courseId}`)
      await loadCourses()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete course.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Manage Courses</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="button" onClick={() => setShowAdd((v) => !v)}>
        {showAdd ? 'Cancel' : 'Add Course'}
      </button>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ margin: '12px 0', padding: '12px', border: '1px solid #ccc', maxWidth: '480px' }}>
          <div>
            <label>
              Title
              <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
            </label>
          </div>
          <div>
            <label>
              Description
              <textarea value={addDescription} onChange={(e) => setAddDescription(e.target.value)} rows="3" />
            </label>
          </div>
          <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Course'}</button>
        </form>
      )}

      {courses.length === 0 && !loading && <p>No courses in your category yet.</p>}

      {courses.map((course) => (
        <div key={course.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '12px', maxWidth: '480px' }}>
          <h3>{course.title}</h3>
          <p>{course.description || 'No description.'}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/admin/courses/${course.id}`} state={{ course }}>Lessons</Link>
            <button type="button" onClick={() => startEdit(course)} disabled={submitting}>Edit</button>
            <button type="button" onClick={() => handleDelete(course.id)} disabled={submitting}>Delete</button>
          </div>

          {editingId === course.id && (
            <form onSubmit={(e) => handleUpdate(e, course.id)} style={{ marginTop: '12px', padding: '12px', border: '1px solid #ccc' }}>
              <div>
                <label>
                  Title
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </label>
              </div>
              <div>
                <label>
                  Description
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows="3" />
                </label>
              </div>
              <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={cancelEdit} disabled={submitting}>Cancel</button>
            </form>
          )}
        </div>
      ))}
    </div>
  )
}

export default ManageCourses
