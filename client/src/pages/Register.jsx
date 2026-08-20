import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'
import AmbientBackground from '../components/AmbientBackground'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [registerState, setRegisterState] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setRegisterState('loading')
    try {
      const { user } = await register(name, email, password)
      setRegisterState('success')
      setTimeout(() => {
        navigate(dashboardPathForRole(user.role))
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
      setRegisterState('idle')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 w-full max-w-md">
        <Card padding="p-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-on-primary">school</span>
              </div>
              <span className="font-headline-lg text-3xl text-on-surface">HUISHUB</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Create Account</h1>
          </div>

          {error && (
            <Alert variant="error" message={error} className="mb-4" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField>
              <FormField.TextInput
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                icon="person"
              />
            </FormField>

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
              {registerState === 'loading' ? (
                <span className="text-xs text-on-surface-variant/60">Password must be at least 6 characters</span>
              ) : (
                <span className="text-xs text-on-surface-variant/60">Minimum 6 characters</span>
              )}
            </FormField>

            <Button type="submit" variant="primary" loading={registerState === 'loading'} fullWidth>
              {registerState === 'idle' && 'Create Account'}
              {registerState === 'loading' && 'Creating…'}
              {registerState === 'success' && (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-400">check_circle</span>
                  Success
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="mt-2 text-sm text-center text-on-surface-variant/60">
            <Link to="/" className="text-primary hover:underline font-medium">
              ← Back to home
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default Register
