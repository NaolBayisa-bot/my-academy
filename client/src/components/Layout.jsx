import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeToggleContext'
import ThemeToggle from './ThemeToggle'
import Modal from './ui/Modal'
import { useState } from 'react'

// NAV_LINKS configuration by role
export const NAV_LINKS = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard' },
    { label: 'Browse Courses', to: '/student/browse' },
    { label: 'My Enrollment', to: '/student/my-enrollment' },
    { label: 'History', to: '/student/history' },
  ],
  category_admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'My Students', to: '/admin/students' },
    { label: 'Manage Courses', to: '/admin/courses' },
    { label: 'Enrollment Requests', to: '/admin/enrollments' },
    { label: 'Posts', to: '/admin/posts' },
  ],
  super_admin: [
    { label: 'Overview', to: '/super-admin/overview' },
    { label: 'Assign Admins', to: '/super-admin/assign-admins' },
    { label: 'All Students', to: '/super-admin/students' },
    { label: 'Enrollment Requests', to: '/super-admin/enrollments' },
    { label: 'Posts', to: '/super-admin/posts' },
  ],
}

function Layout({ children }) {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const links = NAV_LINKS[user?.role] || []

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="md:pl-[240px] flex flex-col min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-6 bg-surface-container-high/60 backdrop-blur-md border-b border-outline-variant/20">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="material-symbols-outlined text-2xl text-primary">
              school
            </span>
            <span className="font-headline-lg text-on-surface">My-Academy</span>
          </Link>
        </div>

        <Link to="/" className="md:hidden flex items-center gap-2 no-underline">
          <span className="material-symbols-outlined text-2xl text-primary">school</span>
          <span className="font-headline-lg text-on-surface">My-Academy</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">search</span>
              <input
                type="text"
                placeholder="Search..."
                className="w-48 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/60 text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                readOnly
              />
            </div>
          </div>

          <ThemeToggle />
          <button
            type="button"
            className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-sm font-medium text-on-primary">
              {getInitials(user?.name)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-on-surface">{user?.name}</span>
              <span className="text-xs text-meta-label text-primary">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            aria-label="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>

        </div>
      </header>

      {/* Desktop Sidebar */}
      <nav className="hidden md:block fixed inset-y-0 left-0 z-30 w-64">
        <div className="h-full bg-surface-container-low/80 backdrop-blur-2xl border-r border-outline-variant/20 flex flex-col">
          <div className="p-6 border-b border-outline-variant/20">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <span className="material-symbols-outlined text-2xl text-primary">school</span>
              <span className="font-headline-lg text-on-surface">My-Academy</span>
            </Link>
          </div>

          <nav className="flex-1 p-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm ' +
                  'text-on-surface-variant hover:bg-surface-container-high transition-colors ' +
                  (isActive
                    ? 'active-nav-pill text-primary font-medium bg-primary-container/10'
                    : ''
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="md:hidden p-4 border-t border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-base font-medium text-on-primary">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-on-surface">{user?.name}</div>
                <div className="text-xs text-meta-label text-primary">{user?.role?.replace('_', ' ')}</div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Drawer */}
      <Modal
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        size="sm"
      >
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-outline-variant/20">
            <Link to="/" className="flex items-center gap-3 no-underline" onClick={() => setIsSidebarOpen(false)}>
              <span className="material-symbols-outlined text-2xl text-primary">school</span>
              <span className="font-headline-lg text-on-surface">My-Academy</span>
            </Link>
          </div>

          <nav className="flex-1 p-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm ' +
                  'text-on-surface-variant hover:bg-surface-container-high transition-colors ' +
                  (isActive
                    ? 'active-nav-pill text-primary font-medium bg-primary-container/10'
                    : ''
                  )
                }
                onClick={() => setIsSidebarOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between">
            <button
              type="button"
              onClick={logout}
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </Modal>

      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}

export default Layout
