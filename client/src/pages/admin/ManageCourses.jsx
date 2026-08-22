import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import FormField from '../../components/ui/FormField'

function ManageCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addDescription, setAddDescription] = useState('')

  const [editingCourse, setEditingCourse] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const [deletingCourse, setDeletingCourse] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      setCourses((prev) => [
        ...prev,
        { id: Date.now(), title: addTitle, description: addDescription },
      ])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add course.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (course) => {
    setEditingCourse(course)
    setEditTitle(course.title)
    setEditDescription(course.description || '')
    clearError()
  }

  const cancelEdit = () => {
    setEditingCourse(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleUpdate = async (e, courseId) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await api.patch('/courses/' + courseId, {
        title: editTitle,
        description: editDescription,
      })
      cancelEdit()
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, title: editTitle, description: editDescription } : c
        )
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update course.')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteConfirm = (course) => {
    setDeletingCourse(course)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!deletingCourse) return
    clearError()
    setSubmitting(true)
    try {
      await api.delete('/courses/' + deletingCourse.id)
      setCourses((prev) => prev.filter((c) => c.id !== deletingCourse.id))
      setShowDeleteConfirm(false)
      setDeletingCourse(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete course.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10">
          <p className="text-on-surface">Loading courses...</p>
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

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-on-surface font-headline-lg">
              Manage Courses
            </h1>
            <p className="text-on-surface-variant">
              {courses.length} course{courses.length !== 1 ? 's' : ''} in your category
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            Add Course
          </Button>
        </div>

        {courses.length === 0 && (
          <EmptyState
            icon="school"
            title="No courses in your category yet"
            message="Create your first course to help students learn."
          />
        )}

        {courses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="cursor-pointer transition-all duration-200">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-on-surface mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant line-clamp-3">
                    {course.description || 'No description available.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/admin/courses/' + course.id + '" state={{ course }} className="flex-1">
                    <Button variant="secondary" fullWidth>
                      View Lessons
                    </Button>
                  </Link>

                  <Button variant="outline" onClick={() => startEdit(course)}>
                    Edit
                  </Button>

                  <Button variant="danger" onClick={() => openDeleteConfirm(course)}>
                    Delete
                  </Button>
                </div>

                {editingCourse?.id === course.id && (
                  <Card className="mt-4 p-4 bg-surface-container-low/50">
                    <form onSubmit={(e) => handleUpdate(e, course.id)}>
                      <FormField
                        label="Title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                      <FormField
                        label="Description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        as="textarea"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button type="submit" variant="primary" loading={submitting}>
                          Save
                        </Button>
                        <Button type="button" variant="ghost" onClick={cancelEdit}>
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

        <Modal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          title="Add New Course"
        >
          <form onSubmit={handleAdd}>
            <div className="flex flex-col gap-4">
              <FormField
                label="Course Title"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                required
              />
              <FormField
                label="Description"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                as="textarea"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {submitting ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Course"
        >
          <p className="text-on-surface mb-4">
            Are you sure you want to delete{" "}
            <strong className="text-on-surface">{deletingCourse?.title}</strong>?
            <br />
            This action cannot be undone and will affect all enrolled students.
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

export default ManageCourses
