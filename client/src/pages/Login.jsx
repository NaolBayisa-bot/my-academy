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
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p style={{ fontSize: '0.875rem' }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" style={{ color: '#2563eb' }}>
          Sign up
        </Link>
      </p>
      <p style={{ fontSize: '0.875rem' }}>
        <Link to="/" style={{ color: '#2563eb' }}>
          ← Back to home
        </Link>
      </p>
    </div>
  )
}

export default Login
