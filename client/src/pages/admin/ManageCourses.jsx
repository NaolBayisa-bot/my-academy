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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-violet-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Manage Courses</h1>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => setShowAdd((v) => !v)}
        className="mb-4 px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet cursor-pointer"
      >
        {showAdd ? 'Cancel' : 'Add Course'}
      </button>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-glass border border-glass-border rounded-xl shadow-glass max-w-md">
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Course'}
          </button>
        </form>
      )}

      {courses.length === 0 && !loading && <p className="text-slate-400">No courses in your category yet.</p>}

      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-glass border border-glass-border rounded-xl p-4 mb-4 max-w-md"
        >
          <h3 className="text-xl font-semibold mb-2 text-slate-100">{course.title}</h3>
          <p className="text-slate-300 mb-3">{course.description || 'No description.'}</p>
          <div className="flex gap-2 flex-wrap">
            <Link
              to={`/admin/courses/${course.id}`}
              state={{ course }}
              className="px-3 py-1 text-sm text-violet-500 hover:bg-glass border border-glass-border rounded transition-violet"
            >
              Lessons
            </Link>
            <button
              type="button"
              onClick={() => startEdit(course)}
              disabled={submitting}
              className="px-3 py-1 text-sm text-slate-300 hover:bg-glass border border-glass-border rounded transition-violet disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(course.id)}
              disabled={submitting}
              className="px-3 py-1 text-sm text-red-500 hover:bg-red-900/20 border border-red-500/50 rounded transition-violet disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          {editingId === course.id && (
            <form onSubmit={(e) => handleUpdate(e, course.id)} className="mt-4 p-3 bg-glass border border-glass-border rounded-lg">
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1 text-sm text-white bg-violet-500 hover:bg-violet-600 rounded transition-violet disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={submitting}
                  className="px-3 py-1 text-sm text-slate-300 hover:bg-glass border border-glass-border rounded transition-violet disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  )
}

export default ManageCourses
