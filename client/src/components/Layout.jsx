import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole } from '../utils/dashboardPath'
import Footer from './Footer'

const NAV_LINKS = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard', icon: '◫' },
    { label: 'Browse Courses', to: '/student/browse', icon: '📚' },
    { label: 'My Enrollment', to: '/student/my-enrollment', icon: '📝' },
    { label: 'History', to: '/student/history', icon: '◍' },
  ],
  category_admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: '◫' },
    { label: 'My Students', to: '/admin/students', icon: '👥' },
    { label: 'Courses', to: '/admin/courses', icon: '📚' },
    { label: 'Enrollment Requests', to: '/admin/enrollments', icon: '📝' },
    { label: 'Posts', to: '/admin/posts', icon: '📢' },
  ],
  super_admin: [
    { label: 'Dashboard', to: '/super-admin/dashboard', icon: '◫' },
    { label: 'Assign Admins', to: '/super-admin/assign-admins', icon: '▣' },
    { label: 'All Students', to: '/super-admin/students', icon: '👥' },
    { label: 'Enrollment Requests', to: '/super-admin/enrollments', icon: '📝' },
    { label: 'Posts', to: '/super-admin/posts', icon: '📢' },
  ],
}

function Layout({ children }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const links = NAV_LINKS[user?.role] || []

  // Track the mobile breakpoint (< lg = < 1024px).
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    const handler = (e) => {
      setIsMobile(e.matches)
      if (!e.matches) setMobileOpen(false)
    }
    handler(mql)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Close the drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((v) => !v)
    } else {
      setCollapsed((v) => !v)
    }
  }

  return (
    <div className="page-shell min-h-screen flex flex-col pt-16">
      {/* ── Fixed full-width top navbar ─────────────────────────── */}
      <header className="top-navbar fixed top-0 left-0 h-16 shrink-0 w-full flex items-center justify-between gap-4 px-4 md:px-6 border-b border-[rgba(148,175,211,0.15)] bg-[rgba(5,15,29,0.92)] backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              isMobile
                ? mobileOpen ? 'Close menu' : 'Open menu'
                : collapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            className="sidebar-toggle w-9 h-9 grid place-items-center rounded-lg border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted hover:text-cyan-default hover:border-cyan-default/40 transition-colors cursor-pointer"
          >
            {isMobile && mobileOpen ? '✕' : '☰'}
          </button>

          <Link to={dashboardPathForRole(user?.role)} className="inline-flex items-center gap-2.5 no-underline">
            <div className="brand-mark bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.8rem] rounded-lg grid place-items-center w-7 h-7 shadow-[0_0_20px_rgba(56,215,255,0.35)]">
              IS
            </div>
            <span className="font-semibold text-sm md:text-base">IS Hub Academy</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="user-badge hidden sm:inline-flex items-center gap-2.5 rounded-full border border-[rgba(143,170,205,0.12)] bg-[rgba(15,27,40,0.6)] pl-1.5 pr-3 py-1.5">
            <div className="user-avatar bg-gradient-to-br from-cyan-default to-green-default text-[#02131f] font-black text-[0.76rem] w-7 h-7 rounded-full grid place-items-center">
              {(user?.name || 'U').charAt(0)}
            </div>
            <span className="text-sm">{user?.name || 'User'}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="logout-button border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-[var(--text)] px-4 py-2 rounded-[10px] cursor-pointer hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Mobile backdrop (click to close) ────────────────────── */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ── Content row: sidebar + main ─────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        <aside
          className={
            isMobile
              ? `fixed top-16 left-0 z-30 w-[260px] flex flex-col border-r border-[rgba(143,170,205,0.16)] bg-[rgba(5,15,29,0.96)] backdrop-blur-md transition-transform duration-300 ease-in-out overscroll-contain ${
                  mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : `dashboard-sidebar sticky top-16 self-start shrink-0 flex flex-col border-r border-[rgba(143,170,205,0.16)] bg-[rgba(5,15,29,0.9)] transition-[width] duration-300 ease-in-out overflow-hidden ${
                  collapsed ? 'w-[72px]' : 'w-[240px]'
                }`
          }
          style={{ height: 'calc(100dvh - 4rem)' }}
        >
          <nav className="sidebar-nav flex flex-col gap-1.5 p-3 pt-4 overflow-y-auto overscroll-contain" aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={isMobile ? closeMobile : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 no-underline rounded-lg px-3 py-2.5 text-sm whitespace-nowrap text-muted transition-colors duration-200 hover:bg-[rgba(56,215,255,0.08)] hover:text-[var(--text)] ${
                    isActive ? 'active bg-[rgba(56,215,255,0.12)] text-cyan-default' : ''
                  }`
                }
                title={link.label}
              >
                <span className="sidebar-icon w-5 text-center shrink-0">{link.icon}</span>
                {(!collapsed || isMobile) && <span className="truncate">{link.label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main dashboard content */}
        <div className="dashboard-main flex-1 p-4 md:p-8 overflow-x-hidden flex flex-col min-w-0">
          <main className="dashboard-content">{children}</main>
          <Footer className="mt-auto w-full" />
        </div>
      </div>
    </div>
  )
}

export default Layout
