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

  const inputClass =
    'w-full bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.14)] rounded-xl px-3.5 py-2.5 text-sm placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-cyan-default/50 focus:border-cyan-default/50 transition-all duration-200'

  const renderTypeSelect = (value, onChange) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} [&>option]:bg-[#0d1623] cursor-pointer`}
    >
      <option value="video">video</option>
      <option value="download">download</option>
    </select>
  )

  if (loading) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 text-center py-6 text-sm text-muted">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <Link
        to="/admin/courses"
        className="inline-flex items-center gap-1.5 no-underline text-muted hover:text-cyan-default transition-colors text-sm mb-4"
      >
        ← Back to Courses
      </Link>

      <div className="page-header mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Curriculum</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">
            Lessons: {course?.title || 'Course'}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className={showAdd ? 'ghost-btn inline-flex items-center justify-center no-underline text-muted hover:text-cyan-default px-4 py-2.5 rounded-xl transition-colors cursor-pointer' : 'primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 cursor-pointer'}
        >
          {showAdd ? 'Cancel' : '+ Add Lesson'}
        </button>
      </div>

      {error && (
        <p className="m-0 mb-4 text-red-400 text-sm rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
          {error}
        </p>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 flex flex-col gap-4 max-w-xl animate-fade-up">
          <h3 className="text-base font-bold m-0">New lesson</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="add-title">Title</label>
            <input id="add-title" type="text" className={inputClass} value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="add-type">Type</label>
              {renderTypeSelect(addType, setAddType)}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="add-order">Order (optional)</label>
              <input id="add-order" type="number" className={inputClass} value={addOrder} onChange={(e) => setAddOrder(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="add-url">URL</label>
            <input id="add-url" type="url" className={inputClass} value={addUrl} onChange={(e) => setAddUrl(e.target.value)} required />
          </div>

          <button type="submit" disabled={submitting} className="primary-btn mt-1 self-start inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {submitting ? 'Saving...' : 'Save Lesson'}
          </button>
        </form>
      )}

      {lessons.length === 0 && !loading && (
        <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 text-center py-10">
          <p className="m-0 text-muted">No lessons in this course yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 max-w-xl">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-4 transition-colors duration-200 hover:border-cyan-default/25">
            <div className="flex items-center gap-3 flex-wrap">
              <strong className="text-sm">{lesson.title}</strong>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">{lesson.type}</span>
              {lesson.order_index != null && <span className="text-xs text-muted">#{lesson.order_index}</span>}

              <div className="ml-auto flex items-center gap-2">
                <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-3.5 py-2 text-sm rounded-xl hover:border-cyan-default/50 transition-all duration-200 cursor-pointer">
                  Open
                </a>
                <button type="button" onClick={() => startEdit(lesson)} disabled={submitting} className="inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-3.5 py-2 text-sm rounded-xl hover:border-cyan-default/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(lesson.id)} disabled={submitting} className="inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-3.5 py-2 text-sm rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  Delete
                </button>
              </div>
            </div>

            {editingId === lesson.id && (
              <form onSubmit={(e) => handleUpdate(e, lesson.id)} className="mt-4 pt-4 border-t border-[rgba(143,170,205,0.1)] flex flex-col gap-3 animate-fade-up">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" htmlFor={`edit-title-${lesson.id}`}>Title</label>
                  <input id={`edit-title-${lesson.id}`} type="text" className={inputClass} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor={`edit-type-${lesson.id}`}>Type</label>
                    {renderTypeSelect(editType, setEditType)}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor={`edit-order-${lesson.id}`}>Order</label>
                    <input id={`edit-order-${lesson.id}`} type="number" className={inputClass} value={editOrder} onChange={(e) => setEditOrder(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" htmlFor={`edit-url-${lesson.id}`}>URL</label>
                  <input id={`edit-url-${lesson.id}`} type="url" className={inputClass} value={editUrl} onChange={(e) => setEditUrl(e.target.value)} required />
                </div>

                <div className="flex items-center gap-2.5">
                  <button type="submit" disabled={submitting} className="inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={cancelEdit} disabled={submitting} className="inline-flex items-center justify-center no-underline text-muted hover:text-cyan-default px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CourseDetail
