import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

export default function CourseListView() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/students/my-category-courses')
      const courseList = data.courses || data
      setCourses(courseList)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Available Courses
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">
            No courses available yet
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="p-5 flex flex-col gap-3"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {course.description || 'No description available'}
                </p>
                {course.category && (
                  <p className="text-xs text-slate-400 mt-2">
                    Category: {course.category.name}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Link to={`/courses/${course.id}`}>
                  <Button size="sm">View Course</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}