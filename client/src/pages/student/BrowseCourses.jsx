import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useCategoryCourses } from '../../hooks/useCategoryCourses'
import {
  PageHeader,
  Button,
  Input,
  Select,
  Field,
  Alert,
  Chip,
  SkeletonBlock,
} from '../../components/ui'
import { formatDate } from '../../utils/formatters'

// Student course catalog. Lists courses in the student's category they are not
// already enrolled in, with search + sorting and a clear enrollment status.
//
// Data:
//  - GET /students/my-category-courses  -> available courses (now with lessonsCount)
//  - GET /students/my-enrollment        -> current enrollment (to lock actions)

const isNewCourse = (course) => {
  if (!course?.createdAt) return false
  const created = new Date(course.createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created < 7 * 24 * 60 * 60 * 1000
}

function BrowseSkeleton() {
  return (
    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading courses">
      {[0, 1, 2].map((i) => (
        <div key={i} className="panel p-5 flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-5 w-40" />
            </div>
            <SkeletonBlock className="h-6 w-14 rounded-full" />
          </div>
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-4/5" />
          <SkeletonBlock className="h-9 w-40 rounded-xl mt-auto" />
        </div>
      ))}
    </div>
  )
}

function BrowseCourses() {
  const { user } = useAuth()

  const hasCategory = Boolean(user?.category_id)
  const { courses, fetchError: coursesFetchError } = useCategoryCourses(hasCategory)
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [requestingId, setRequestingId] = useState(null)
  const [requestError, setRequestError] = useState(null)

  // Search + sort
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // Track which course was just requested, for a per-card confirmation.
  const [requestedCourseId, setRequestedCourseId] = useState(null)

  const hasActiveEnrollment =
    enrollment && ['pending', 'in_progress'].includes(enrollment.status)

  useEffect(() => {
    if (!user?.category_id) return

    let cancelled = false
    const load = async () => {
      try {
        const enrollmentRes = await api.get('/students/my-enrollment')
        if (cancelled) return
        setEnrollment(enrollmentRes.data.enrollment)
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err.response?.data?.error || 'Failed to load courses. Please try again.'
          )
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

  // A student who hasn't picked a category yet must do so first.
  if (!user?.category_id) {
    return <Navigate to="/student/select-category" replace />
  }

  const handleRequest = async (course) => {
    setRequestingId(course.id)
    setRequestError(null)
    setRequestedCourseId(null)
    try {
      await api.post('/enrollments', { courseId: course.id })
      setRequestedCourseId(course.id)
      // Optimistically lock the buttons now that a pending enrollment exists.
      setEnrollment({ status: 'pending', course_id: course.id })
    } catch (err) {
      setRequestError(
        err.response?.data?.error || 'Failed to request enrollment. Please try again.'
      )
    } finally {
      setRequestingId(null)
    }
  }

  // Filter + sort the catalog. The list is small, so this is computed inline
  // (a hook here would violate rules-of-hooks because of the early skip above).
  const q = query.trim().toLowerCase()
  let list = courses
  if (q) {
    list = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    )
  }
  const visibleCourses = list.slice().sort((a, b) => {
    if (sortBy === 'az') return a.title.localeCompare(b.title)
    if (sortBy === 'lessons') return (b.lessonsCount || 0) - (a.lessonsCount || 0)
    // newest first by createdAt
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })

  const notice = hasActiveEnrollment
    ? enrollment.status === 'pending'
      ? 'You have a pending enrollment request. Waiting for admin approval.'
      : 'You have an in-progress course. Finish or withdraw from it before requesting a new enrollment.'
    : null

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <PageHeader
        eyebrow="Learning catalog"
        title="Browse Courses"
        subtitle={`${courses.length} course${courses.length === 1 ? '' : 's'} available in your category.`}
      />

      {/* Enrollment-status notice — explains why request buttons are locked */}
      {hasActiveEnrollment && (
        <div
          role="status"
          className="alert alert-notice flex items-center justify-between gap-4 flex-wrap animate-fade-up"
        >
          <p className="m-0 text-sm flex items-center gap-2 flex-wrap">
            <span aria-hidden="true">💡</span>
            <span>{notice}</span>
          </p>
          <Link
            to="/student/my-enrollment"
            className="text-xs font-semibold text-cyan-default no-underline hover:underline focus-visible:outline-2 focus-visible:outline-cyan-default rounded shrink-0"
          >
            Go to my enrollment →
          </Link>
        </div>
      )}

      {/* Errors */}
      {(fetchError || coursesFetchError || requestError) && (
        <Alert tone="error" className="mb-5">{fetchError || coursesFetchError || requestError}</Alert>
      )}

      {/* Search + sort controls */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end mb-6">
        <Field label="Search" htmlFor="course-search">
          <Input
            id="course-search"
            type="search"
            placeholder="Search by title or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Field label="Sort by" htmlFor="course-sort">
          <Select id="course-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="az">Title A–Z</option>
            <option value="lessons">Most lessons</option>
          </Select>
        </Field>
      </div>

      {/* Loading skeleton */}
      {loading && <BrowseSkeleton />}

      {/* Empty state */}
      {!loading && visibleCourses.length === 0 && (
        <div className="flex flex-col items-center gap-3 text-center py-12">
          <span className="text-3xl" aria-hidden="true">🔍</span>
          <p className="text-sm text-muted m-0">
            No courses match your search or filter.
          </p>
        </div>
      )}

      {/* Course grid */}
      {!loading && visibleCourses.length > 0 && (
        <div className="card-grid grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((course) => {
            const isNew = isNewCourse(course)
            const justRequested = requestedCourseId === course.id
            const locked = hasActiveEnrollment || !!requestingId
            return (
              <article
                key={course.id}
                className={`rounded-2xl border bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 ${
                  justRequested
                    ? 'border-green-default/40'
                    : 'border-[rgba(143,170,205,0.12)] hover:border-cyan-default/30'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-base font-bold m-0 leading-snug">{course.title}</h3>
                  </div>
                  {isNew && (
                    <Chip variant="success" size="sm" className="uppercase font-bold text-[10px] shrink-0">
                      New
                    </Chip>
                  )}
                </div>

                <p className="text-sm text-muted leading-relaxed m-0 line-clamp-3">
                  {course.description || 'No description provided.'}
                </p>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted pt-3 border-t border-[rgba(143,170,205,0.1)]">
                  <span>🧠 {course.lessonsCount ?? 0} lessons</span>
                  {course.createdAt && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>added {formatDate(course.createdAt)}</span>
                    </>
                  )}
                </div>

                <div className="mt-auto pt-1">
                  {justRequested ? (
                    <p className="text-xs text-green-default font-medium flex items-center gap-1.5 m-0">
                      <span aria-hidden="true">✓</span> Requested — waiting for approval
                    </p>
                  ) : (
                    <Button
                      onClick={() => handleRequest(course)}
                      disabled={locked}
                      aria-disabled={locked || undefined}
                    >
                      {requestingId === course.id
                        ? 'Requesting...'
                        : 'Request Enrollment'}
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BrowseCourses
