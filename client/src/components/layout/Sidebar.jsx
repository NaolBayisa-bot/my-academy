import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSidebar } from '../../context/SidebarContext'
import { Role } from '../../constants'

function NavItem({ icon, label, href, isActive, disabled }) {
  return (
    <Link
      to={disabled ? '#' : href}
      onClick={disabled ? (e) => { e.preventDefault() } : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-tech-border hover:text-slate-900 dark:hover:text-white'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      {icon}
      {label && (
        <span className={`truncate ${!label && 'invisible'}`}>{label}</span>
      )}
    </Link>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const location = useLocation()

  const getNavItems = () => {
    if (user?.role === Role.STUDENT) {
      return [
        { label: 'Dashboard', icon: '📊', href: '/dashboard' },
        { label: 'My Courses', icon: '📚', href: '/courses' },
        { label: 'My Enrollments', icon: '📋', href: '/enrollments', disabled: true },
        { label: 'History', icon: '📜', href: '/student/history', disabled: true },
        { label: 'Resources', icon: '📁', href: '/resources', disabled: true },
      ]
    }

    if (user?.role === Role.CATEGORY_ADMIN) {
      return [
        { label: 'Dashboard', icon: '📊', href: '/admin/courses' },
        { label: 'Courses', icon: '📚', href: '/admin/courses' },
        { label: 'Course Detail', icon: '📖', href: '/admin/courses/123', disabled: true },
        { label: 'Enrollments', icon: '📋', href: '/admin/enrollments/pending', disabled: true },
        { label: 'Students', icon: '👥', href: '/admin/students', disabled: true },
        { label: 'Posts', icon: '📰', href: '/admin/posts', disabled: true },
        { label: 'Resources', icon: '📁', href: '/admin/resources', disabled: true },
      ]
    }

    if (user?.role === Role.MAIN_ADMIN) {
      return [
        { label: 'Overview', icon: '📊', href: '/admin' },
        { label: 'All Students', icon: '👥', href: '/admin/students', disabled: true },
        { label: 'Assign Admins', icon: '🔐', href: '/admin/courses', disabled: true },
        { label: 'Enrollments', icon: '📋', href: '/admin/enrollments/pending', disabled: true },
        { label: 'Posts', icon: '📰', href: '/admin/posts', disabled: true },
        { label: 'Resources', icon: '📁', href: '/admin/resources', disabled: true },
      ]
    }

    return []
  }

  const navItems = getNavItems()
  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <aside className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <nav className="p-3">
        {/* Toggle button at top */}
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-tech-border transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={isCollapsed ? null : item.label}
              href={item.href}
              isActive={isActive(item.href)}
              disabled={item.disabled}
            />
          ))}
        </div>
      </nav>
    </aside>
  )
}
