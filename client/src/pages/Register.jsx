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
    <div className="page-shell min-h-screen flex flex-col">
      <header className="relative z-[1] w-[min(1200px,calc(100%-48px))] mx-auto pt-[22px] pb-2.5 flex items-center justify-between border-b border-[rgba(148,175,211,0.15)]">
        <div className="inline-flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.8rem] rounded-lg grid place-items-center w-7 h-7 shadow-[0_0_20px_rgba(56,215,255,0.35)]">
            IS
          </div>
          <span className="font-semibold">IS Hub Academy</span>
        </div>

        <Link
          to="/login"
          className="text-muted hover:text-cyan-default transition-colors no-underline px-4 py-2 rounded-[10px] border border-transparent hover:border-cyan-default/30"
        >
          Login
        </Link>
      </header>

      <main className="relative z-[1] flex-1 flex items-center justify-center p-6 py-12">
        <div
          aria-hidden="true"
          className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[420px] h-[220px] rounded-[50%] bg-[radial-gradient(circle,rgba(45,212,167,0.22),transparent_60%)] blur-[24px] pointer-events-none animate-float-glow"
        />

        <div className="w-full max-w-md rounded-2xl border border-[rgba(143,170,205,0.14)] bg-panel-strong backdrop-blur-md shadow-[0_20px_60px_rgba(2,11,23,0.6),0_0_40px_rgba(13,190,255,0.08)] p-8 md:p-10 flex flex-col gap-7 animate-fade-up">
          <div>
            <p className="text-xs font-semibold text-green-default uppercase tracking-[0.18em] m-0 mb-2">
              Get started
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">
              Create your account
            </h1>
            <span className="block text-sm text-muted mt-1.5">
              Join IS Hub Academy and start building real skills.
            </span>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="register-name">
                First Name
              </label>
              <input
                id="register-name"
                className="w-full bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.14)] rounded-xl px-3.5 py-2.5 text-base placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-cyan-default/50 focus:border-cyan-default/50 transition-all duration-200"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                className="w-full bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.14)] rounded-xl px-3.5 py-2.5 text-base placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-cyan-default/50 focus:border-cyan-default/50 transition-all duration-200"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="register-password">
                Password
              </label>
              <input
                id="register-password"
                className="w-full bg-[rgba(9,17,27,0.6)] border border-[rgba(143,170,205,0.14)] rounded-xl px-3.5 py-2.5 text-base placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-cyan-default/50 focus:border-cyan-default/50 transition-all duration-200"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
              />
            </div>

            {error && (
              <p className="m-0 text-red-400 text-sm rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold py-3 px-4 rounded-xl cursor-pointer shadow-[0_8px_24px_rgba(13,190,255,0.25)] hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(13,190,255,0.35)] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Register
            </button>
          </form>

          <p className="m-0 text-center text-sm text-muted pt-4 border-t border-[rgba(143,170,205,0.1)]">
            Already have an account?{' '}
            <Link to="/login" className="no-underline font-semibold text-cyan-default hover:text-cyan-strong transition-colors">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Register
