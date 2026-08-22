import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

export default function CourseViewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [completedLessonIds, setCompletedLessonIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const coursesResponse = await api.get('/courses?categoryId=' + (user?.approvedCategoryId || user?.category_id))
      const courses = coursesResponse.data.courses || coursesResponse.data
      const courseData = Array.isArray(courses) ? courses.find(c => c.id === id) : courses
      setCourse(courseData)
      
      const enrollmentResponse = await api.get('/students/my-enrollment')
      const enrollmentData = enrollmentResponse.data.enrollment
      setEnrollment(enrollmentData)
      
      enrollmentData?.course?.lessons?.length && setActiveLessonId(enrollmentData.course.lessons[0].id)
      enrollmentData?.lessonProgresses && setCompletedLessonIds(enrollmentData.lessonProgresses.map(lp => lp.lesson_id))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const lessons = enrollment?.course?.lessons || []
  const activeLesson = lessons.find(l => l.id === activeLessonId)

  const markComplete = async (lessonId) => {
    setSaving(true)
    setError('')
    try {
      await api.post(`/enrollments/${enrollment?.id}/lessons/${lessonId}/complete`)
      setCompletedLessonIds(prev => [...new Set([...prev, lessonId])])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update progress')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-12 w-12" /></div>
  if (error) return <div className="p-6"><p className="text-red-500">{error}</p></div>
  if (!course) return <div className="p-6"><p className="text-slate-500">Course not found</p></div>
  if (!enrollment || enrollment.status === 'rejected') {
    return (
      <div className="p-6">
        <p className="text-slate-500 text-center">{enrollment?.status === 'rejected' 
          ? 'Enrollment rejected. Contact admin.' 
          : 'Not enrolled. Enroll first.'}</p>
      </div>
    )
  }
  if (enrollment.status === 'pending') {
    return <div className="p-6"><p className="text-slate-500 text-center">Enrollment pending approval</p></div>
  }

  const totalLessons = lessons.length
  const completedCount = completedLessonIds.length
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{course.description}</p>
        <div className="h-2 bg-slate-200 dark:bg-tech-border rounded-full mt-2">
          <div className="h-2 bg-green-500 rounded-full" style={{width: progressPercent + '%'}} />
        </div>
        <p className="text-xs text-slate-500 mt-1">{completedCount}/{totalLessons} completed</p>
      </Card>

      {lessons.length === 0 ? (
        <Card><p className="text-slate-500">No lessons yet</p></Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, i) => (
            <Card key={lesson.id}>
              <h3 className="font-semibold">Lesson {i+1}: {lesson.title}</h3>
              <p className="text-sm text-slate-500">{lesson.type} • {lesson.url}</p>
              <div className="flex gap-2 mt-2">
                <a href={lesson.url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="secondary">Open</Button></a>
                {!completedLessonIds.includes(lesson.id) && <Button size="sm" onClick={() => markComplete(lesson.id)} isLoading={saving}>Complete</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}