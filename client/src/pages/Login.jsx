import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'
import { Button, Field, Input, Alert } from '../components/ui'

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
    <div className="page-shell min-h-screen flex flex-col">
      <header className="relative z-[1] w-[min(1200px,calc(100%-48px))] mx-auto pt-[22px] pb-2.5 flex items-center justify-between border-b border-[rgba(148,175,211,0.15)]">
        <div className="inline-flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.8rem] rounded-lg grid place-items-center w-7 h-7 shadow-[0_0_20px_rgba(56,215,255,0.35)]">
            IS
          </div>
          <span className="font-semibold">IS Hub Academy</span>
        </div>

        <Link to="/register" className="btn btn-ghost">
          Register
        </Link>
      </header>

      <main className="relative z-[1] flex-1 flex items-center justify-center p-6">
        <div
          aria-hidden="true"
          className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[420px] h-[220px] rounded-[50%] bg-[radial-gradient(circle,rgba(32,214,255,0.28),transparent_60%)] blur-[24px] pointer-events-none animate-float-glow"
        />

        <div className="w-full max-w-md panel-strong p-8 md:p-10 flex flex-col gap-7 animate-fade-up shadow-[0_20px_60px_rgba(2,11,23,0.6),0_0_40px_rgba(13,190,255,0.08)]">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">
              Login to your account
            </h1>
            <span className="block text-sm text-muted mt-1.5">
              Continue your learning journey.
            </span>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Field label="Email" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </Field>

            <Field label="Password" htmlFor="login-password">
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>

            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" className="mt-1 w-full" size="lg">
              Login
            </Button>
          </form>

          <p className="m-0 text-center text-sm text-muted pt-4 border-t border-[rgba(143,170,205,0.1)]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="no-underline font-semibold text-cyan-default hover:text-cyan-strong transition-colors">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
