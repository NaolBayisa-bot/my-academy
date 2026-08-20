import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'

function LandingPage() {
  const { user, loading } = useAuth()

  // For authenticated users, offer a direct link back into their dashboard
  // instead of the generic sign-in/register CTAs.
  const dashboardPath = dashboardPathForRole(user?.role)

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header with glass effect */}
      <header className="flex items-center justify-between px-6 py-4 bg-glass border-b border-glass-border shadow-glass">
        <Link to="/" className="text-2xl font-bold text-violet-500 hover:text-violet-400 transition-violet no-underline">
          HUISHUB
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center gap-12 py-12 px-4 max-w-4xl mx-auto">
        {/* Hero section */}
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-violet-500">
            Your personal learning hub
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Discover, enroll in, and master courses across every category — all in one place.
          </p>

          {!loading &&
            (user ? (
              <Link
                to={dashboardPath}
                className="inline-block px-8 py-3 text-lg font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet"
              >
                Go to your dashboard
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="inline-block px-8 py-3 text-lg font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-block px-8 py-3 text-lg font-medium text-slate-200 bg-glass border border-glass-border rounded-lg hover:bg-slate-800 transition-violet"
                >
                  Get started
                </Link>
              </div>
            ))}
        </section>

        {/* Features section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-glass border border-glass-border rounded-xl p-6 shadow-glass text-center">
            <h3 className="text-xl font-semibold text-violet-400 mb-2">Browse courses</h3>
            <p className="text-slate-400">
              Explore courses across every category and find the right path.
            </p>
          </div>
          <div className="bg-glass border border-glass-border rounded-xl p-6 shadow-glass text-center">
            <h3 className="text-xl font-semibold text-violet-400 mb-2">Track progress</h3>
            <p className="text-slate-400">
              Resume where you left off with automatic lesson tracking.
            </p>
          </div>
          <div className="bg-glass border border-glass-border rounded-xl p-6 shadow-glass text-center">
            <h3 className="text-xl font-semibold text-violet-400 mb-2">Stay updated</h3>
            <p className="text-slate-400">
              Get the latest posts and announcements from your categories.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-slate-500 border-t border-glass-border">
        <p>© {new Date().getFullYear()} HUISHUB. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage