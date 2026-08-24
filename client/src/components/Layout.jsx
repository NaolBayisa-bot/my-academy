import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard', icon: '◫' },
    { label: 'Browse Courses', to: '/student/browse', icon: '◌' },
    { label: 'My Enrollment', to: '/student/my-enrollment', icon: '▣' },
    { label: 'History', to: '/student/history', icon: '◍' },
  ],
  category_admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: '◫' },
    { label: 'My Students', to: '/admin/students', icon: '◌' },
    { label: 'Courses', to: '/admin/courses', icon: '▣' },
    { label: 'Enrollment Requests', to: '/admin/enrollments', icon: '◍' },
    { label: 'Posts', to: '/admin/posts', icon: '✦' },
  ],
  super_admin: [
    { label: 'Dashboard', to: '/super-admin/dashboard', icon: '◫' },
    { label: 'Assign Admins', to: '/super-admin/assign-admins', icon: '▣' },
    { label: 'All Students', to: '/super-admin/students', icon: '◌' },
    { label: 'Enrollment Requests', to: '/super-admin/enrollments', icon: '◍' },
    { label: 'Posts', to: '/super-admin/posts', icon: '✦' },
  ],
}

function Layout({ children }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const links = NAV_LINKS[user?.role] || []

  return (
    <div className="page-shell min-h-screen flex">
      <aside
        className={`dashboard-sidebar flex flex-col gap-4 border-r border-[rgba(143,170,205,0.16)] bg-[rgba(5,15,29,0.9)] p-4 transition-all duration-300 ${
          collapsed ? 'w-[90px] min-w-[90px] px-2.5' : 'w-[240px] min-w-[240px]'
        }`}
      >
        <div className="sidebar-header flex items-center justify-between">
          <div className="brand-block inline-flex items-center gap-2.5">
            <div className="brand-mark bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.8rem] rounded-lg grid place-items-center w-7 h-7 shadow-[0_0_20px_rgba(56,215,255,0.35)]">
              IS
            </div>
            {!collapsed && (
              <span className="brand-name font-semibold text-sm">IS Hub Academy</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="sidebar-toggle w-6 h-6 grid place-items-center rounded-md border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted hover:text-cyan-default hover:border-cyan-default/40 transition-colors cursor-pointer"
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav flex flex-col gap-1.5" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 no-underline rounded-lg px-3 py-2.5 text-sm text-muted transition-all duration-200 hover:bg-[rgba(56,215,255,0.08)] hover:text-[var(--text)] ${
                  isActive ? 'active bg-[rgba(56,215,255,0.12)] text-cyan-default border-l-2 border-cyan-default' : ''
                }`
              }
              title={link.label}
            >
              <span className="sidebar-icon w-5 text-center">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer mt-auto">
          <div className="sidebar-pill truncate text-xs text-muted px-2.5 py-2 rounded-full border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-center">
            {user?.name || 'User'}
          </div>
        </div>
      </aside>

      <div className="dashboard-main flex-1 p-6 md:p-8 overflow-x-hidden">
        <header className="dashboard-topbar flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[rgba(148,175,211,0.15)] max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-xl font-bold m-0">Good evening, {user?.name || 'User'}</h2>
          </div>

          <div className="topbar-actions flex items-center gap-3">
            <div className="user-badge inline-flex items-center gap-2.5 rounded-full border border-[rgba(143,170,205,0.12)] px-3 py-1.5 pr-3 pl-1.5">
              <div className="user-avatar bg-gradient-to-br from-cyan-default to-green-default text-[#02131f] font-black text-[0.76rem] w-7 h-7 rounded-full grid place-items-center">
                {(user?.name || 'U').charAt(0)}
              </div>
              <span className="text-sm">{user?.name || 'User'}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="logout-button border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-[var(--text)] px-4 py-2.5 rounded-[10px] cursor-pointer hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content pt-1">{children}</main>
      </div>
    </div>
  )
}

export default Layout
