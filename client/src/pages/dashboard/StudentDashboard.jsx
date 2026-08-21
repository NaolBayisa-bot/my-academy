import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnrollment()
  }, [])

  const fetchEnrollment = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/students/my-enrollment')
      setEnrollment(data.enrollment)
    } catch {
      setEnrollment(null)
    } finally {
      setLoading(false)
    }
  }

  const totalLessons = trainings.reduce(
    (sum, t) => sum + (t?.totalLessons ?? 0),
    0,
  )
  const totalCompleted = trainings.reduce(
    (sum, t) => sum + (t?.completedLessons ?? 0),
    0,
  )
  const overallPercent = totalLessons
    ? Math.round((totalCompleted / totalLessons) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <span className="text-primary-500 font-mono">{'>'} </span>Welcome,{' '}
          {user?.firstName} {user?.lastName}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-sm">
          ~/dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Approved Category
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
            {user?.approvedCategoryId ? 'Assigned' : 'Not yet assigned'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <p className="text-lg font-semibold text-green-600 mt-1">Active</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
            Student
          </p>
        </Card>
      </div>

      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Overall Progress
        </h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-tech-border rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">
                {overallPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {totalCompleted} of {totalLessons} lessons completed
            </p>
          </div>
        )}
      </Card>

      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Trainings
          </h3>
          <Button
            size="sm"
            onClick={() => (window.location.href = '/trainings')}
          >
            Browse Trainings
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">First Name</p>
            <p className="font-medium dark:text-gray-200">
              {user?.firstName}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Last Name</p>
            <p className="font-medium dark:text-gray-200">
              {user?.lastName}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium dark:text-gray-200">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Department</p>
            <p className="font-medium dark:text-gray-200">
              {user?.department}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Academic Year</p>
            <p className="font-medium dark:text-gray-200">
              {user?.academicYear}
            </p>
          </div>
        </div>
      </Card>

      <p className="text-gray-400 dark:text-gray-500 text-sm text-center mt-8">
        Trainings, modules, and progress tracking — coming in Sprint 2.
      </p>
    </div>
  )
}
