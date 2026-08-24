import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'

// Dedicated 403 page. Rendered when a logged-in user tries to access a
// section their role isn't allowed to see (ProtectedRoute redirects here).
function NotAuthorized() {
  const { user } = useAuth()
  const dashboardPath = user ? dashboardPathForRole(user.role) : '/login'

  return (
    <div className="page-shell min-h-screen flex flex-col">
      <header className="relative z-[1] w-[min(1200px,calc(100%-48px))] mx-auto pt-[22px] pb-2.5 flex items-center justify-between border-b border-[rgba(148,175,211,0.15)]">
        <div className="inline-flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.8rem] rounded-lg grid place-items-center w-7 h-7 shadow-[0_0_20px_rgba(56,215,255,0.35)]">
            IS
          </div>
          <span className="font-semibold">IS Hub Academy</span>
        </div>
      </header>

      <main className="relative z-[1] flex-1 flex items-center justify-center p-6">
        <div
          aria-hidden="true"
          className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[420px] h-[240px] rounded-[50%] bg-[radial-gradient(circle,rgba(239,68,68,0.22),transparent_60%)] blur-[24px] pointer-events-none animate-float-glow"
        />

        <div className="w-full max-w-lg rounded-2xl border border-[rgba(143,170,205,0.14)] bg-panel-strong backdrop-blur-md shadow-[0_20px_60px_rgba(2,11,23,0.6)] p-8 md:p-12 text-center flex flex-col items-center gap-6 animate-fade-up">
          {/* 403 badge */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full grid place-items-center bg-red-500/10 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.25)] animate-pulse-soft">
              <span className="text-4xl" aria-hidden="true">🔒</span>
            </div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-red-500/15 border border-red-500/30 text-red-300 whitespace-nowrap">
              ACCESS DENIED
            </span>
          </div>

          <div className="mt-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter m-0 leading-none bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
              403
            </h1>
            <h2 className="text-xl md:text-2xl font-bold mt-3 mb-2">Not Authorized</h2>
            <p className="text-muted text-sm leading-relaxed m-0 max-w-sm mx-auto">
              Sorry{user?.name ? `, ${user.name}` : ''} — you don&apos;t have permission
              to access this section. This area is restricted to other roles.
            </p>
          </div>

          {user && (
            <p className="m-0 text-xs text-muted rounded-full border border-[rgba(143,170,205,0.18)] bg-[rgba(9,17,27,0.6)] px-4 py-1.5">
              Signed in as <span className="text-cyan-default font-medium">{user.email || user.name}</span>
              {' '}· role: <span className="uppercase tracking-wider">{(user.role || 'unknown').replace('_', ' ')}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link
              to={dashboardPath}
              className="primary-action inline-flex items-center gap-2 no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-6 py-3 rounded-xl shadow-[0_8px_24px_rgba(13,190,255,0.25)] hover:scale-[1.03] transition-all duration-200"
            >
              {user ? 'Go to my dashboard' : 'Go to login'}
            </Link>
            <Link
              to="/"
              className="secondary-action inline-flex items-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-6 py-3 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200"
            >
              Back to home
            </Link>
          </div>

          <p className="m-0 text-xs text-muted pt-4 border-t border-[rgba(143,170,205,0.1)] w-full">
            Think you should have access? Contact a super admin to request permission.
          </p>
        </div>
      </main>
    </div>
  )
}

export default NotAuthorized
