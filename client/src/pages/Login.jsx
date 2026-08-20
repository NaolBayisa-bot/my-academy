import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'
import AmbientBackground from '../components/AmbientBackground'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { user } = await login(email, password)
      navigate(dashboardPathForRole(user.role))
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 w-full max-w-md">
        <Card padding="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-on-surface font-headline-lg">
              Welcome Back
            </h1>
            <Link to="/" className="text-on-surface-variant hover:text-on-surface transition-colors text-sm">
              ← Home
            </Link>
          </div>

          {error && (
            <Alert variant="error" message={error} className="mb-4" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField>
              <FormField.TextInput
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon="mail"
              />
            </FormField>

            <FormField>
              <FormField.PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormField>

            <Link to="/forgot-password" className="text-xs text-primary hover:underline text-meta-label">
              Forgot password?
            </Link>

            <Button type="submit" variant="primary" loading={loading} fullWidth>
              {loading ? 'Signing In…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default Login
