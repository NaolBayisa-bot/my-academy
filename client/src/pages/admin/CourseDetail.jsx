import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Button } from '../../components/ui'

function CourseDetail() {
  const { courseId } = useParams()
  const location = useLocation()
  const course = location.state?.course

  // Modules with nested lessons: [{ id, title, description, order_index, lessons: [...] }]
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add module form state
  const [showAddModule, setShowAddModule] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleDescription, setModuleDescription] = useState('')
  const [moduleOrder, setModuleOrder] = useState('')

  // Add lesson form state — tracks which module the new lesson belongs to.
  const [showAddLessonFor, setShowAddLessonFor] = useState(null)
  const [addTitle, setAddTitle] = useState('')
  const [addType, setAddType] = useState('video')
  const [addUrl, setAddUrl] = useState('')
  const [addContent, setAddContent] = useState('')
  const [addOrder, setAddOrder] = useState('')

  // Edit lesson form state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('video')
  const [editUrl, setEditUrl] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editOrder, setEditOrder] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const loadModules = async () => {
    const res = await api.get(`/courses/${courseId}/modules`)
    setModules(res.data.modules)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/modules`)
        if (!cancelled) setModules(res.data.modules)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load modules.')
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

  const handleAddModule = async (e) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await api.post(`/courses/${courseId}/modules`, {
        title: moduleTitle,
        description: moduleDescription === '' ? undefined : moduleDescription,
        order_index: moduleOrder === '' ? undefined : Number(moduleOrder),
      })
      setModuleTitle('')
      setModuleDescription('')
      setModuleOrder('')
      setShowAddModule(false)
      await loadModules()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add module.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteModule = async (moduleId) => {
    clearError()
    setSubmitting(true)
    try {
      await api.delete(`/modules/${moduleId}`)
      await loadModules()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete module.')
    } finally {
      setSubmitting(false)
    }
  }

  const openAddLesson = (moduleId) => {
    setShowAddLessonFor(moduleId)
    setAddTitle('')
    setAddType('video')
    setAddUrl('')
    setAddContent('')
    setAddOrder('')
    clearError()
  }

  const handleAddLesson = async (e, moduleId) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, {
        title: addTitle,
        type: addType,
        url: addUrl,
        content: addContent.trim() === '' ? undefined : addContent,
        order_index: addOrder === '' ? undefined : Number(addOrder),
      })
      setAddTitle('')
      setAddUrl('')
      setAddContent('')
      setAddOrder('')
      setShowAddLessonFor(null)
      await loadModules()
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
    setEditContent(lesson.content || '')
    setEditOrder(lesson.order_index ?? '')
    clearError()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditType('video')
    setEditUrl('')
    setEditContent('')
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
        // Sending the field always lets clearing work (server maps '' -> NULL).
        content: editContent,
        order_index: editOrder === '' ? undefined : Number(editOrder),
      })
      cancelEdit()
      await loadModules()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update lesson.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    clearError()
    setSubmitting(true)
    try {
      await api.delete(`/lessons/${lessonId}`)
      await loadModules()
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

  const lessonFormFields = (idPrefix) => (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-title`}>Title</label>
        <input id={`${idPrefix}-title`} type="text" className={inputClass} value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-type`}>Type</label>
          {renderTypeSelect(addType, setAddType)}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-order`}>Order (optional)</label>
          <input id={`${idPrefix}-order`} type="number" className={inputClass} value={addOrder} onChange={(e) => setAddOrder(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-url`}>URL</label>
        <input id={`${idPrefix}-url`} type="url" className={inputClass} value={addUrl} onChange={(e) => setAddUrl(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-content`}>
          Lesson notes / test examples <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-content`}
          className={`${inputClass} min-h-24 font-mono text-[13px]`}
          rows={5}
          placeholder={'Explain this lesson… attach test examples as fenced code blocks: ```js console.log(1) ```'}
          value={addContent}
          onChange={(e) => setAddContent(e.target.value)}
        />
      </div>
    </>
  )

  const editLessonForm = (lesson) => (
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor={`edit-content-${lesson.id}`}>
          Lesson notes / test examples <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id={`edit-content-${lesson.id}`}
          className={`${inputClass} min-h-24 font-mono text-[13px]`}
          rows={5}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
        />
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
  )

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
            Modules & Lessons: {course?.title || 'Course'}
          </h1>
        </div>

        <Button
          type="button"
          onClick={() => setShowAddModule((v) => !v)}
          variant={showAddModule ? 'ghost' : 'primary'}
        >
          {showAddModule ? 'Cancel' : '+ Add Module'}
        </Button>
      </div>

      {error && (
        <p className="m-0 mb-4 text-red-400 text-sm rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
          {error}
        </p>
      )}

      {showAddModule && (
        <form onSubmit={handleAddModule} className="mb-6 rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 flex flex-col gap-4 max-w-xl animate-fade-up">
          <h3 className="text-base font-bold m-0">New module</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="module-title">Title</label>
            <input id="module-title" type="text" className={inputClass} value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="module-desc">Description (optional)</label>
              <input id="module-desc" type="text" className={inputClass} value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="module-order">Order (optional)</label>
              <input id="module-order" type="number" className={inputClass} value={moduleOrder} onChange={(e) => setModuleOrder(e.target.value)} />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="mt-1 self-start">
            {submitting ? 'Saving...' : 'Save Module'}
          </Button>
        </form>
      )}

      {modules.length === 0 && !loading && (
        <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 text-center py-10">
          <p className="m-0 text-muted">No modules in this course yet. Add a module first.</p>
        </div>
      )}

      <div className="flex flex-col gap-5 max-w-3xl">
        {modules.map((module) => (
          <section key={module.id} className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 transition-colors duration-200 hover:border-cyan-default/25">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-black m-0">{module.title}</h2>
              {module.order_index != null && <span className="text-xs text-muted">#{module.order_index}</span>}

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAddLesson(module.id)}
                  disabled={submitting}
                  className="inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-3.5 py-2 text-sm rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  + Lesson
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteModule(module.id)}
                  disabled={submitting}
                  className="inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-3.5 py-2 text-sm rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Delete Module
                </button>
              </div>
            </div>

            {module.description && (
              <p className="text-sm text-muted mt-1.5 mb-0">{module.description}</p>
            )}

            {showAddLessonFor === module.id && (
              <form onSubmit={(e) => handleAddLesson(e, module.id)} className="mt-4 pt-4 border-t border-[rgba(143,170,205,0.1)] flex flex-col gap-3 animate-fade-up">
                <h4 className="text-sm font-bold m-0">New lesson in &ldquo;{module.title}&rdquo;</h4>
                {lessonFormFields(`add-${module.id}`)}
                <div className="flex items-center gap-2.5">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Lesson'}
                  </Button>
                  <Button type="button" onClick={() => setShowAddLessonFor(null)} disabled={submitting} variant="ghost">
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {(module.lessons || []).length === 0 ? (
              <p className="text-sm text-muted m-0 mt-4 text-center py-3">
                No lessons in this module yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3 mt-4">
                {(module.lessons || []).map((lesson) => (
                  <div key={lesson.id} className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.6)] p-4 transition-colors duration-200 hover:border-cyan-default/25">
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
                        <button type="button" onClick={() => handleDeleteLesson(lesson.id)} disabled={submitting} className="inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-3.5 py-2 text-sm rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                          Delete
                        </button>
                      </div>
                    </div>

                    {editingId === lesson.id && editLessonForm(lesson)}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

export default CourseDetail
