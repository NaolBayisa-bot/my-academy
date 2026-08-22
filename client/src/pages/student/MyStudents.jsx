import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import AmbientBackground from '../components/AmbientBackground'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import FormField from '../components/ui/FormField'
import StatCard from '../components/ui/StatCard'

const categories = [
  { id: 'programming', name: 'Programming', icon: 'code', description: 'Learn to code' },
  { id: 'design', name: 'Design', icon: 'palette', description: 'Create beautiful things' },
  { id: 'marketing', name: 'Marketing', icon: 'campaign', description: 'Grow your audience' },
  { id: 'business', name: 'Business', icon: 'work', description: 'Build your career' },
]

function SelectCategory() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSelect = async (categoryId) => {
    setLoading(true)
    setError(null)
    try {
      await api.post('/students/select-category', { category_id: categoryId })
      localStorage.setItem('selected_category', categoryId)
      setSuccess('Category selected! Redirecting to dashboard...')
      setTimeout(() => {
        window.location.href = '/student/dashboard'
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to select category.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={true} />

      <div className="relative z-10 p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface font-headline-lg mb-2">
            Onboarding
          </h1>
          <p className="text-on-surface-variant">Select your learning category</p>
        </div>

        {error && <Alert variant="error" message={error} />}
        {success && <Alert variant="success" message={success} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="cursor-pointer transition-all duration-200">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl text-primary">{cat.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-on-surface mb-2">{cat.name}</h3>
                <p className="text-sm text-on-surface-variant mb-4">{cat.description}</p>
                <Button variant="primary" fullWidth loading={loading} onClick={() => handleSelect(cat.id)}>
                  Select Track
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function MyStudents() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/students/my-enrollment')
        if (!cancelled) {
          const enrollment = res.data.enrollment
          if (!enrollment) {
            setEnrollments([])
          } else {
            // Convert single enrollment response to array format for consistency
            setEnrollments(enrollment.course ? [enrollment.course] : [])
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load your courses.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6">
        <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">
          My Courses
        </h1>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <p className="text-on-surface">Loading courses...</p>
          </div>
        )}

        {error && <Alert variant="error" message={error} />}

        {!loading && enrollments.length === 0 && (
          <EmptyState
            icon="school"
            title="No courses yet"
            message="Browse courses to enroll in learning tracks."
          />
        )}

        {!loading && enrollments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((course) => (
              <Card key={course.id}>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-on-surface mb-2">{course.title}</h3>
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
                    {course.description || 'No description available'}
                  </p>
                  <Link to={"//admin/courses/" + course.id} className="inline-block">
                    <Button variant="secondary" fullWidth>
                      View Course
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { SelectCategory, MyStudents }
export default SelectCategory
