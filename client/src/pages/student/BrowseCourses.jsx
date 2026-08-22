import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'

function BrowseCourses() {
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [requestingId, setRequestingId] = useState(null)
  const [requestError, setRequestError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const hasActiveEnrollment =
    enrollment && ['pending', 'in_progress'].includes(enrollment.status)

  useEffect(() => {
    if (!user?.category_id) return

    let cancelled = false
    const load = async () => {
      try {
        const [coursesRes, enrollmentRes] = await Promise.all([
          api.get('/students/my-category-courses'),
          api.get('/students/my-enrollment'),
        ])
        if (cancelled) return
        setCourses(coursesRes.data.courses)
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

  if (!user?.category_id) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <Card padding="p-8" className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-on-surface mb-4 font-headline-lg">
              Select Your Category
            </h1>
            <p className="text-on-surface-variant mb-6">
              Please select a category first to browse courses.
            </p>
            <Link to="/student/select-category">
              <Button variant="primary">Select Category</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  const handleRequest = async (course) => {
    setRequestingId(course.id)
    setRequestError(null)
    setSuccessMessage(null)
    try {
      await api.post('/enrollments', { courseId: course.id })
      setSuccessMessage('Enrollment requested - waiting for admin approval')
      setEnrollment({ status: 'pending', course_id: course.id })
    } catch (err) {
      setRequestError(
        err.response?.data?.error || 'Failed to request enrollment. Please try again.'
      )
    } finally {
      setRequestingId(null)
    }
  }

  const bannerMessage = enrollment?.status === 'pending'
    ? 'You have a pending enrollment request. Waiting for admin approval.'
    : 'You have an in-progress course. Finish or withdraw from it before requesting a new enrollment.'

  const isLocked = hasActiveEnrollment
  const isRequesting = (id) => requestingId === id

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6">
        <Card className="mb-6 max-w-2xl mx-auto">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-on-surface font-headline-lg">
              Browse Courses
            </h1>
            <p className="text-on-surface-variant mt-1">
              Discover courses in your category
            </p>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">search</span>
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        {hasActiveEnrollment && (
          <Alert variant="warning" className="mb-6 max-w-2xl mx-auto text-center">
            {bannerMessage}
          </Alert>
        )}

        {successMessage && (
          <p className="mb-4 text-tertiary text-center max-w-2xl mx-auto">{successMessage}</p>
        )}
        {requestError && (
          <p className="mb-4 text-error text-center max-w-2xl mx-auto">{requestError}</p>
        )}
        {fetchError && (
          <p className="mb-4 text-error text-center max-w-2xl mx-auto">{fetchError}</p>
        )}

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="text-primary">Loading courses...</div>
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon="school"
            title="No Courses Available"
            message="There are no courses in your category yet. Check back soon!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="cursor-pointer transition-all duration-200">
                <div className="mb-4 h-40 rounded-xl bg-gradient-to-r from-primary/20 to-tertiary/20 flex items-center justify-center overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-primary/50">book</span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-on-surface mb-2">{course.title}</h3>
                <p className="text-sm text-on-surface-variant line-clamp-3 mb-3">
                  {course.description || 'No description available for this course.'}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <Badge status="global">{course.category?.name || 'General'}</Badge>
                  {course.level && <Badge status="completed">{course.level}</Badge>}
                </div>

                <Button
                  variant={isLocked || isRequesting(course.id) ? 'ghost' : 'primary'}
                  disabled={isLocked || isRequesting(course.id)}
                  loading={isRequesting(course.id)}
                  fullWidth
                  onClick={() => handleRequest(course)}
                >
                  {isLocked 
                    ? 'Request Enrollment (Locked)' 
                    : isRequesting(course.id) 
                      ? 'Requesting...' 
                      : 'Request Enrollment'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowseCourses
