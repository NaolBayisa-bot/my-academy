import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    { label: 'Overview', to: '/super-admin/overview' },
    { label: 'Posts', to: '/super-admin/posts' },
  ],
}

function Layout({ children }) {
  const { user, logout } = useAuth()
  const links = NAV_LINKS[user?.role] || []

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '12px 20px',
          background: '#1f2937',
          color: '#fff',
        }}
      >
        <Link to="/" style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}>
          LMS Platform
        </Link>
        <nav style={{ display: 'flex', gap: '16px' }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                color: '#fff',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal',
                borderBottom: isActive ? '2px solid #fff' : 'none',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{user?.name}</span>
          <button type="button" onClick={logout} style={{ cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>
      <main style={{ padding: '20px' }}>{children}</main>
    </div>
  )
}

export default Layout
