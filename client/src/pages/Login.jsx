import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { user } = await login(email, password)
      navigate(dashboardPathForRole(user.role))
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="page-shell auth-shell">
      <header className="site-header">
        <div className="brand-block">
          <div className="brand-mark">IS</div>
          <span className="brand-name">IS Hub Academy</span>
        </div>

        <div className="header-actions">
          <button type="button" className="header-icon-button" aria-label="Help">
            ?
          </button>
          <button type="button" className="header-icon-button" aria-label="Info">
            i
          </button>
          <Link to="/register" className="ghost-link">
            Register
          </Link>
        </div>
      </header>

      <main className="auth-card">
        <h1>Welcome back</h1>
        <span className="auth-subtitle">login — new</span>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="auth-button">
            Login
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </main>
    </div>
  )
}

export default Login
