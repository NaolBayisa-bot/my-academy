import { Link } from 'react-router-dom'
import { dashboardPathForRole } from '../utils/dashboardPath'
import { useAuth } from '../context/AuthContext'
import AmbientBackground from '../components/AmbientBackground'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

function NotAuthorized() {
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 w-full max-w-lg">
        <Card padding="p-10 text-center">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 border-2 border-primary/30 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
            <div className="absolute w-32 h-32 border-2 border-tertiary/30 rounded-full animate-[spin_15s_linear_reverse]" />
            <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-r from-primary to-tertiary flex items-center justify-center shadow-glow-primary shadow-glow-tertiary animate-pulse">
              <span className="material-symbols-outlined text-2xl text-on-primary">gpp_bad</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant font-headline-lg">
            Access Denied
          </h1>

          <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
            You do not have permission to access this page. Please contact your administrator 
            if you believe this is an error.
          </p>

          <Link to={dashboardPathForRole(user?.role)}>
            <Button variant="primary">
              Return to Dashboard
            </Button>
          </Link>

          <p className="mt-8 text-sm text-on-surface-variant/60">
            Error Code: 403
          </p>

          <div className="mt-6">
            <Link to="/" className="text-primary hover:underline text-sm">
              ← Back to Home
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default NotAuthorized
