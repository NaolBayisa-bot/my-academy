import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function PendingApprovalPage() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Registration Pending
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Hi {user?.firstName} {user?.lastName}, your account is under review. An
          administrator will approve your registration and assign you to a
          category. You&apos;ll be able to access the platform once approved.
        </p>

        <div className="bg-slate-50 dark:bg-tech-card rounded-tech border border-slate-200 dark:border-tech-border p-4 mb-6 text-left font-mono text-sm">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            Your Details
          </p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500 dark:text-gray-400">Name:</span>{' '}
              <span className="font-medium dark:text-gray-200">
                {user?.firstName} {user?.lastName}
              </span>
            </p>
            <p>
              <span className="text-gray-500 dark:text-gray-400">Email:</span>{' '}
              <span className="font-medium dark:text-gray-200">{user?.email}</span>
            </p>
            <p>
              <span className="text-gray-500 dark:text-gray-400">Department:</span>{' '}
              <span className="font-medium dark:text-gray-200">
                {user?.department}
              </span>
            </p>
            <p>
              <span className="text-gray-500 dark:text-gray-400">Year:</span>{' '}
              <span className="font-medium dark:text-gray-200">
                {user?.academicYear}
              </span>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Check back later or contact the ICT Directorate if you have questions.
        </p>

        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </Card>
    </div>
  )
}
