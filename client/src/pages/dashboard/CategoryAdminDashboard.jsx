import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Card from '../../components/ui/Card'

export default function CategoryAdminDashboard() {
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
      const { data } = await api.get('/courses', {
        params: { categoryId: user.category_id }
      })
      setCourses(data.courses || data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Category Admin Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your category courses
          </p>
        </div>
        <Link to="/admin/courses/new">
          <Button>+ New Course</Button>
        </Link>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No courses yet
          </p>
          <Link to="/admin/courses/new">
            <Button>Create your first course</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                  {course.description || 'No description'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/courses/${course.id}`}>
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
