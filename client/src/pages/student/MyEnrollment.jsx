import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ProgressBar from '../../components/ui/ProgressBar'
import Badge from '../../components/ui/Badge'

function MyEnrollment() {
  const [enrollment, setEnrollment] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingId, setCompletingId] = useState(null)

  const loadEnrollment = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const res = await api.get('/students/my-enrollment')
      setEnrollment(res.data.enrollment)
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to load your enrollment. Please try again.'
      )
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadEnrollment(true)
  }, [])

  useEffect(() => {
    if (enrollment && enrollment.status === 'in_progress') {
      api
        .get('/enrollments/' + enrollment.id + '/progress')
        .then((res) => setProgress(res.data))
        .catch((err) =>
          setError(
            err.response?.data?.error || 'Failed to load progress. Please try again.'
          )
        )
    } else {
      setProgress(null)
    }
  }, [enrollment])

  const handleComplete = async (lessonId) => {
    setCompletingId(lessonId)
    setError(null)
    try {
      await api.post(
        '/enrollments/' + enrollment.id + '/lessons/' + lessonId + '/complete'
      )
      await loadEnrollment()
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to mark lesson complete. Please try again.'
      )
    } finally {
      setCompletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10">
          <Card>
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">hourglass_bottom</span>
              <p className="text-on-surface">Loading enrollment...</p>
            </div>
          </Card>
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

  if (!enrollment) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 w-full max-w-md">
          <EmptyState
            icon="play_circle_outline"
            title="No Active Enrollment"
            message="You don't have an active enrollment yet. Browse courses to get started."
            actionLabel="Browse Courses"
            onAction={() => {}}
          />
        </div>
      </div>
    )
  }

  const { course, lessons } = enrollment
  const status = enrollment.status

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">
          My Enrollment
        </h1>

        {status === 'pending' && (
          <>
            <Alert variant="info" message={
              <>
                Waiting for admin approval for course: <strong className="text-on-surface">{course?.title || 'the selected course'}</strong>
              </>
            } className="mb-4" />
            
            <Card>
              <div className="p-6 text-center">
                <Badge status="pending">Pending Approval</Badge>
                <p className="text-on-surface-variant mt-3">
                  An admin will review your enrollment request shortly. You will be notified once approved.
                </p>
              </div>
            </Card>
          </>
        )}

        {status === 'completed' && (
          <Card className="text-center">
            <div className="flex flex-col items-center gap-4 p-6">
              <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-tertiary">check_circle</span>
              </div>
              <Badge status="completed">COMPLETED</Badge>
              <h2 className="text-xl font-semibold text-on-surface">
                Congratulations!
              </h2>
              <p className="text-on-surface-variant">
                You have completed <strong className="text-on-surface">{course?.title || 'this course'}</strong>
              </p>
              <Link to="/student/browse" className="inline-block">
                <Button variant="primary">
                  Browse More Courses
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {status === 'in_progress' && (
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge status="in_progress">IN PROGRESS</Badge>
              </div>

              <h3 className="text-lg font-semibold text-on-surface mb-4">
                {course?.title || 'Untitled Course'}
              </h3>

              <p className="text-on-surface-variant mb-4">
                {progress?.completedCount ?? 0} of {progress?.totalLessons ?? 0} lessons completed
              </p>

              <ProgressBar percentage={progress?.percentage ?? 0} className="mb-6" />

              <div className="space-y-3">
                {lessons?.map((lesson) => {
                  const isCompleted = (progress?.completedLessonIds || []).includes(lesson.id)
                  return (
                    <Card key={lesson.id} className="p-4">
                      <label className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-sm">
                            {isCompleted ? 'check_circle' : 'play_arrow'}
                          </span>
                          <span className={'text-sm ' + (isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface')}>
                            {lesson.title} ({lesson.type})
                          </span>
                        </div>
                        <a
                          href={lesson.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Open
                        </a>
                      </label>
                    </Card>
                  )
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MyEnrollment
