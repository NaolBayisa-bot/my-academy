import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api from '../../api/axios'

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

  const renderTypeSelect = (value, onChange) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="video">video</option>
      <option value="download">download</option>
    </select>
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Lessons: {course?.title || 'Course'}</h1>
      <Link to="/admin/courses">Back to Courses</Link>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: '12px' }}>
        <button type="button" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : 'Add Lesson'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ margin: '12px 0', padding: '12px', border: '1px solid #ccc', maxWidth: '480px' }}>
          <div>
            <label>
              Title
              <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
            </label>
          </div>
          <div>
            <label>Type {renderTypeSelect(addType, setAddType)}</label>
          </div>
          <div>
            <label>
              URL
              <input type="url" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} required />
            </label>
          </div>
          <div>
            <label>
              Order
              <input type="number" value={addOrder} onChange={(e) => setAddOrder(e.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Lesson'}</button>
        </form>
      )}

      {lessons.length === 0 && !loading && <p>No lessons in this course yet.</p>}

      {lessons.map((lesson) => (
        <div key={lesson.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '8px', maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong>{lesson.title}</strong>
            <span>({lesson.type})</span>
            {lesson.order_index != null && <span>#{lesson.order_index}</span>}
            <a href={lesson.url} target="_blank" rel="noopener noreferrer">Open</a>
            <button type="button" onClick={() => startEdit(lesson)} disabled={submitting}>Edit</button>
            <button type="button" onClick={() => handleDelete(lesson.id)} disabled={submitting}>Delete</button>
          </div>

          {editingId === lesson.id && (
            <form onSubmit={(e) => handleUpdate(e, lesson.id)} style={{ marginTop: '12px', padding: '12px', border: '1px solid #ccc' }}>
              <div>
                <label>
                  Title
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </label>
              </div>
              <div><label>Type {renderTypeSelect(editType, setEditType)}</label></div>
              <div>
                <label>
                  URL
                  <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} required />
                </label>
              </div>
              <div>
                <label>
                  Order
                  <input type="number" value={editOrder} onChange={(e) => setEditOrder(e.target.value)} />
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

export default CourseDetail
