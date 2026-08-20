import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api from '../../api/axios'

function renderTypeSelect(value, onChange) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 bg-glass border border-glass-border rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
    >
      <option value="video">Video</option>
      <option value="text">Text</option>
      <option value="link">Link</option>
    </select>
  )
}

function CourseDetail() {
  const { courseId } = useParams()
  const location = useLocation()
  const course = location.state?.course

  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add lesson form state
  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addType, setAddType] = useState('video')
  const [addUrl, setAddUrl] = useState('')
  const [addOrder, setAddOrder] = useState('')

  // Edit lesson form state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('video')
  const [editUrl, setEditUrl] = useState('')
  const [editOrder, setEditOrder] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const loadLessons = async () => {
    const res = await api.get(`/courses/${courseId}/lessons`)
    setLessons(res.data.lessons)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/lessons`)
        if (!cancelled) setLessons(res.data.lessons)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load lessons.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  const clearError = () => setError(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await api.post(`/courses/${courseId}/lessons`, {
        title: addTitle,
        type: addType,
        url: addUrl,
        order_index: addOrder === '' ? undefined : Number(addOrder),
      })
      setAddTitle('')
      setAddUrl('')
      setAddOrder('')
      setShowAdd(false)
      await loadLessons()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add lesson.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (lesson) => {
    setEditingId(lesson.id)
    setEditTitle(lesson.title)
    setEditType(lesson.type)
    setEditUrl(lesson.url)
    setEditOrder(lesson.order_index ?? '')
    clearError()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditType('video')
    setEditUrl('')
    setEditOrder('')
  }

  const handleUpdate = async (e, lessonId) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await api.patch(`/lessons/${lessonId}`, {
        title: editTitle,
        type: editType,
        url: editUrl,
        order_index: editOrder === '' ? undefined : Number(editOrder),
      })
      cancelEdit()
      await loadLessons()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update lesson.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (lessonId) => {
    clearError()
    setSubmitting(true)
    try {
      await api.delete(`/lessons/${lessonId}`)
      await loadLessons()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete lesson.')
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
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/admin/courses"
          className="text-violet-500 hover:text-violet-400 transition-violet"
        >
          ← Back to Courses
        </Link>
        <h1 className="text-2xl font-bold text-violet-500">
          Lessons: {course?.title || 'Course'}
        </h1>
      </div>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet cursor-pointer"
        >
          {showAdd ? 'Cancel' : 'Add Lesson'}
        </button>
      </div>

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
            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
            {renderTypeSelect(addType, setAddType)}
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
            <input
              type="url"
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              required
              className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-300 mb-1">Order</label>
            <input
              type="number"
              value={addOrder}
              onChange={(e) => setAddOrder(e.target.value)}
              className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Lesson'}
          </button>
        </form>
      )}

      {lessons.length === 0 && !loading && (
        <p className="text-slate-400">No lessons in this course yet.</p>
      )}

      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className="bg-glass border border-glass-border rounded-xl p-4 mb-4 max-w-md"
        >
          <div className="flex items-center gap-3">
            <strong className="text-slate-100">{lesson.title}</strong>
            <span className="text-slate-500">({lesson.type})</span>
            {lesson.order_index != null && <span className="text-slate-500">#{lesson.order_index}</span>}
            <a
              href={lesson.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-500 hover:text-violet-400 transition-violet text-sm"
            >
              Open
            </a>
            <button
              type="button"
              onClick={() => startEdit(lesson)}
              disabled={submitting}
              className="px-2 py-1 text-xs text-slate-300 hover:bg-glass border border-glass-border rounded transition-violet disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(lesson.id)}
              disabled={submitting}
              className="px-2 py-1 text-xs text-red-500 hover:bg-red-900/20 border border-red-500/50 rounded transition-violet disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          {editingId === lesson.id && (
            <form
              onSubmit={(e) => handleUpdate(e, lesson.id)}
              className="mt-4 p-3 bg-glass border border-glass-border rounded-lg"
            >
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
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                {renderTypeSelect(editType, setEditType)}
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Order</label>
                <input
                  type="number"
                  value={editOrder}
                  onChange={(e) => setEditOrder(e.target.value)}
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

export default CourseDetail
