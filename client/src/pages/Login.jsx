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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 px-4">
      <div className="w-full max-w-md bg-glass border border-glass-border rounded-xl shadow-glass p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-violet-500">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 px-4 font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet cursor-pointer"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-violet-500 hover:text-violet-400 transition-violet font-medium">
            Sign up
          </Link>
        </p>

        <p className="mt-2 text-sm text-center text-slate-400">
          <Link to="/" className="text-violet-500 hover:text-violet-400 transition-violet font-medium">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
