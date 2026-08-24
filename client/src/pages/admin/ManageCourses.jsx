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
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Manage Courses</h1>
          <p className="page-subtitle text-sm text-muted mt-1.5">Create, edit, and organize the learning material for your category.</p>
        </div>
        <button type="button" className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : 'Add Course'}
        </button>
      </div>

      {error && <p className="form-error text-red-400 text-sm m-0">{error}</p>}

      {showAdd && (
        <form onSubmit={handleAdd} className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 form-grid grid gap-4 sm:grid-cols-2">
          <div className="field flex flex-col gap-1.5">
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

          <div className="field flex flex-col gap-1.5">
            <label htmlFor="course-description">Description</label>
            <textarea
              id="course-description"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              rows="4"
              placeholder="Write a short description"
            />
          </div>

          <button type="submit" className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Course'}
          </button>
        </form>
      )}

      {courses.length === 0 && !loading && <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6"><p className="page-subtitle text-sm text-muted mt-1.5">No courses in your category yet.</p></div>}

      <div className="card-grid grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <article key={course.id} className="list-card rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30">
            <div className="card-top flex justify-between items-start gap-4">
              <div>
                <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Course</p>
                <h3>{course.title}</h3>
              </div>
              <span className="chip neutral inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">Active</span>
            </div>

            <p>{course.description || 'No description.'}</p>

            <div className="button-row flex flex-wrap items-center gap-2.5 mt-2">
              <Link to={`/admin/courses/${course.id}`} state={{ course }} className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                Lessons
              </Link>
              <button type="button" className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" onClick={() => startEdit(course)} disabled={submitting}>
                Edit
              </button>
              <button type="button" className="danger-btn inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" onClick={() => handleDelete(course.id)} disabled={submitting}>
                Delete
              </button>
            </div>

            {editingId === course.id && (
              <form onSubmit={(e) => handleUpdate(e, course.id)} className="form-grid grid gap-4 sm:grid-cols-2">
                <div className="field flex flex-col gap-1.5">
                  <label htmlFor={`edit-title-${course.id}`}>Title</label>
                  <input
                    id={`edit-title-${course.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="field flex flex-col gap-1.5">
                  <label htmlFor={`edit-description-${course.id}`}>Description</label>
                  <textarea
                    id={`edit-description-${course.id}`}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="3"
                  />
                </div>

                <div className="button-row flex flex-wrap items-center gap-2.5 mt-2">
                  <button type="submit" className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="ghost-btn inline-flex items-center justify-center no-underline text-muted hover:text-cyan-default px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" onClick={cancelEdit} disabled={submitting}>
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
