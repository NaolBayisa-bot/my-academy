import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { user } = await register(name, email, password)
      navigate(dashboardPathForRole(user.role))
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
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
          <Link to="/login" className="ghost-link">
            Login
          </Link>
        </div>
      </header>

      <main className="auth-card">
        <h1>Create Your Account</h1>
        <span className="auth-subtitle">register — new</span>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              First Name
            </label>
            <input
              id="register-name"
              className="auth-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="auth-button">
            Register
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </main>
    </div>
  )
}

export default Register
