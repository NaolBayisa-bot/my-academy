import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import {
  ContentPage,
  PageHeader,
  Button,
  Field,
  Input,
  Textarea,
  Alert,
  Chip,
  SkeletonBlock,
} from '../../components/ui'

function ManageCoursesSkeleton() {
  return (
    <ContentPage aria-busy="true" aria-label="Loading courses">
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel p-5 flex flex-col gap-3">
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-5 w-3/4" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </ContentPage>
  )
}

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
    return <ManageCoursesSkeleton />
  }

  return (
    <ContentPage>
      <PageHeader
        title="Manage Courses"
        subtitle="Create, edit, and organize the learning material for your category."
        action={
          <Button variant={showAdd ? 'secondary' : 'primary'} onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Cancel' : 'Add Course'}
          </Button>
        }
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      {showAdd && (
        <form onSubmit={handleAdd} className="panel-shell p-5 mb-6 grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="course-title">
            <Input
              id="course-title"
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              required
              placeholder="Course title"
            />
          </Field>

          <Field label="Description" htmlFor="course-description">
            <Textarea
              id="course-description"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              rows="4"
              placeholder="Write a short description"
            />
          </Field>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Course'}
          </Button>
        </form>
      )}

      {courses.length === 0 && !loading && (
        <div className="panel-shell p-5 mb-6">
          <p className="page-subtitle">No courses in your category yet.</p>
        </div>
      )}

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <article key={course.id} className="panel p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="eyebrow">Course</p>
                <h3 className="font-bold text-base m-0">{course.title}</h3>
              </div>
              <Chip variant="neutral" size="sm">Active</Chip>
            </div>

            <p className="text-sm text-muted leading-relaxed m-0">{course.description || 'No description.'}</p>

            <div className="flex flex-wrap items-center gap-2.5 mt-2">
              <Link to={`/admin/courses/${course.id}`} state={{ course }} className="btn btn-secondary">
                Modules
              </Link>
              <Button variant="secondary" onClick={() => startEdit(course)} disabled={submitting}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDelete(course.id)} disabled={submitting}>
                Delete
              </Button>
            </div>

            {editingId === course.id && (
              <form onSubmit={(e) => handleUpdate(e, course.id)} className="grid gap-4 sm:grid-cols-2 mt-2">
                <Field label="Title" htmlFor={`edit-title-${course.id}`}>
                  <Input
                    id={`edit-title-${course.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Description" htmlFor={`edit-description-${course.id}`}>
                  <Textarea
                    id={`edit-description-${course.id}`}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="3"
                  />
                </Field>

                <div className="flex flex-wrap items-center gap-2.5 mt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" onClick={cancelEdit} disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </article>
        ))}
      </div>
    </ContentPage>
  )
}

export default ManageCourses
