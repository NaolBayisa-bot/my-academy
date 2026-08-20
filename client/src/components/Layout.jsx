import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeToggleContext'

// Navbar links shown per role. The Layout only decides which links are
// visible; access is still enforced by each route's ProtectedRoute.
const NAV_LINKS = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard' },
    { label: 'Browse Courses', to: '/student/browse' },
    { label: 'My Enrollment', to: '/student/my-enrollment' },
    { label: 'History', to: '/student/history' },
  ],
  category_admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'My Students', to: '/admin/students' },
    { label: 'Courses', to: '/admin/courses' },
    { label: 'Enrollment Requests', to: '/admin/enrollments' },
    { label: 'Posts', to: '/admin/posts' },
  ],
  super_admin: [
    { label: 'Dashboard', to: '/super-admin/dashboard' },
    { label: 'Assign Admins', to: '/super-admin/assign-admins' },
    { label: 'All Students', to: '/super-admin/students' },
    { label: 'Enrollment Requests', to: '/super-admin/enrollments' },
    { label: 'Posts', to: '/super-admin/posts' },
  ],
}

function Layout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const links = NAV_LINKS[user?.role] || []

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-4 bg-glass border-b border-glass-border shadow-glass">
        <Link to="/" className="text-2xl font-bold text-violet-500 hover:text-violet-400 transition-violet no-underline">
          HUISHUB
        </Link>

        <nav className="flex gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-slate-200 hover:text-white transition-violet ${
                  isActive ? 'border-b-2 border-white font-bold' : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-slate-200">{user?.name}</span>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-slate-200 hover:bg-glass border border-glass-border rounded-lg transition-violet cursor-pointer"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-200 hover:bg-glass border border-glass-border rounded-lg transition-violet cursor-pointer"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

export default Layout
