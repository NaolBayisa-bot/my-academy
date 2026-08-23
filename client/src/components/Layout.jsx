import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
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
    <div className={`dashboard-shell page-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-block">
            <div className="brand-mark">IS</div>
            <span className="brand-name">IS Hub Academy</span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-pill">{user?.name || 'User'}</div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <h1>Good evening, {user?.name || 'User'} </h1>
            <p>Here&apos;s what&apos;s happening across your cloud resources.</p>
          </div>

          <div className="topbar-actions">
            <div className="user-badge">
              <div className="user-avatar">{(user?.name || 'U').charAt(0)}</div>
              <span>{user?.name || 'User'}</span>
            </div>
            <button type="button" className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  )
}

export default Layout
