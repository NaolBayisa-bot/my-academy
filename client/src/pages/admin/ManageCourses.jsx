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
    <div className="content-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Courses</h1>
          <p className="page-subtitle">Create, edit, and organize the learning material for your category.</p>
        </div>
        <button type="button" className="primary-btn" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : 'Add Course'}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {showAdd && (
        <form onSubmit={handleAdd} className="section-shell form-grid">
          <div className="field">
            <label htmlFor="course-title">Title</label>
            <input
              id="course-title"
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              required
              placeholder="Course title"
            />
          </div>

          <div className="field">
            <label htmlFor="course-description">Description</label>
            <textarea
              id="course-description"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              rows="4"
              placeholder="Write a short description"
            />
          </div>

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Course'}
          </button>
        </form>
      )}

      {courses.length === 0 && !loading && <div className="section-shell"><p className="page-subtitle">No courses in your category yet.</p></div>}

      <div className="card-grid">
        {courses.map((course) => (
          <article key={course.id} className="list-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">Course</p>
                <h3>{course.title}</h3>
              </div>
              <span className="chip neutral">Active</span>
            </div>

            <p>{course.description || 'No description.'}</p>

            <div className="button-row">
              <Link to={`/admin/courses/${course.id}`} state={{ course }} className="secondary-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                Lessons
              </Link>
              <button type="button" className="secondary-btn" onClick={() => startEdit(course)} disabled={submitting}>
                Edit
              </button>
              <button type="button" className="danger-btn" onClick={() => handleDelete(course.id)} disabled={submitting}>
                Delete
              </button>
            </div>

            {editingId === course.id && (
              <form onSubmit={(e) => handleUpdate(e, course.id)} className="form-grid">
                <div className="field">
                  <label htmlFor={`edit-title-${course.id}`}>Title</label>
                  <input
                    id={`edit-title-${course.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor={`edit-description-${course.id}`}>Description</label>
                  <textarea
                    id={`edit-description-${course.id}`}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="3"
                  />
                </div>

                <div className="button-row">
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="ghost-btn" onClick={cancelEdit} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export default ManageCourses
