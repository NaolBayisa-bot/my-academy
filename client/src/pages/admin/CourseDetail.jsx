import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import FormField from '../../components/ui/FormField'
import EmptyState from '../../components/ui/EmptyState'

function CourseDetail() {
  const { courseId } = useParams()
  const location = useLocation()
  const course = location.state?.course

  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addType, setAddType] = useState('video')
  const [addUrl, setAddUrl] = useState('')
  const [addOrder, setAddOrder] = useState('')

  const [editingLesson, setEditingLesson] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('video')
  const [editUrl, setEditUrl] = useState('')
  const [editOrder, setEditOrder] = useState('')

  const [deletingLesson, setDeletingLesson] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/courses/' + courseId + '/lessons')
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
      await api.post('/courses/' + courseId + '/lessons', {
        title: addTitle,
        type: addType,
        url: addUrl,
        order_index: addOrder === '' ? undefined : Number(addOrder),
      })
      setAddTitle('')
      setAddType('video')
      setAddUrl('')
      setAddOrder('')
      setShowAdd(false)
      setLessons((prev) => [...prev])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add lesson.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (lesson) => {
    setEditingLesson(lesson)
    setEditTitle(lesson.title)
    setEditType(lesson.type)
    setEditUrl(lesson.url)
    setEditOrder(lesson.order_index ?? '')
    clearError()
  }

  const cancelEdit = () => {
    setEditingLesson(null)
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
      await api.patch('/lessons/' + lessonId, {
        title: editTitle,
        type: editType,
        url: editUrl,
        order_index: editOrder === '' ? undefined : Number(editOrder),
      })
      cancelEdit()
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId
            ? { ...l, title: editTitle, type: editType, url: editUrl, order_index: Number(editOrder) || undefined }
            : l
        )
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update lesson.')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteConfirm = (lesson) => {
    setDeletingLesson(lesson)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!deletingLesson) return
    clearError()
    setSubmitting(true)
    try {
      await api.delete('/lessons/' + deletingLesson.id)
      setLessons((prev) => prev.filter((l) => l.id !== deletingLesson.id))
      setShowDeleteConfirm(false)
      setDeletingLesson(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete lesson.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10">
          <p className="text-on-surface">Loading lessons...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error" message={error} />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/courses">
            <Button variant="ghost" size="sm">
              <span className="material-symbols-outlined">arrow_back</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-on-surface font-headline-lg">
            {course?.title || 'Course Lessons'}
          </h1>
        </div>

        {course?.description && (
          <Card className="mb-6">
            <p className="text-on-surface">{course.description}</p>
          </Card>
        )}

        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-on-surface">
            Lessons ({lessons.length})
          </h2>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            Add Lesson
          </Button>
        </div>

        {lessons.length === 0 && (
          <EmptyState
            icon="menu_book"
            title="No lessons yet"
            message="Add your first lesson to get started."
          />
        )}

        {lessons.length > 0 && (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Card key={lesson.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge status="completed">{lesson.type?.replace(/_/g, ' ').toUpperCase()}</Badge>
                    <span className="text-sm text-on-surface-variant">
                      Order: {lesson.order_index || '-'}
                    </span>
                    <a
                      href={lesson.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      <span className="material-symbols-outlined">open_in_new</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(lesson)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openDeleteConfirm(lesson)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {lesson.title && (
                  <p className="text-on-surface mt-2">{lesson.title}</p>
                )}

                {editingLesson?.id === lesson.id && (
                  <Card className="mt-3 p-3 bg-surface-container-low/50">
                    <form onSubmit={(e) => handleUpdate(e, lesson.id)}>
                      <FormField
                        label="Title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                      <div className="gap-4 flex">
                        <FormField
                          label="Type"
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          as="select"
                          options={[
                            { value: 'video', label: 'Video' },
                            { value: 'download', label: 'Download' },
                          ]}
                        />
                        <FormField
                          label="URL"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          required
                        />
                      </div>
                      <FormField
                        label="Order"
                        value={editOrder}
                        onChange={(e) => setEditOrder(e.target.value)}
                        type="number"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button type="submit" variant="primary" loading={submitting}>
                          Save
                        </Button>
                        <Button variant="ghost" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
              </Card>
            ))}
          </div>
        )}

        <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Lesson">
          <form onSubmit={handleAdd}>
            <div className="flex flex-col gap-4">
              <FormField
                label="Lesson Title"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                required
              />

              <FormField
                label="Type"
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
                as="select"
                options={[
                  { value: 'video', label: 'Video' },
                  { value: 'download', label: 'Download' },
                ]}
              />

              <FormField
                label="URL"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                required
              />

              <FormField
                label="Order (optional)"
                value={addOrder}
                onChange={(e) => setAddOrder(e.target.value)}
                type="number"
                placeholder="Auto-number if left blank"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {submitting ? 'Adding...' : 'Add Lesson'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Lesson"
        >
          <p className="text-on-surface mb-4">
            Are you sure you want to delete the lesson{" "}
            <strong className="text-on-surface">"{deletingLesson?.title}"</strong>?
            <br />
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>
              Delete
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default CourseDetail
