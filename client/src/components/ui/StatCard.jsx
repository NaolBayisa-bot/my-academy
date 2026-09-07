// Single reusable stat-card shell. Consolidates the copy-pasted StatCard
// implementations from the admin + super-admin dashboards.
//
//   <StatCard icon="👥" iconBg="bg-cyan-soft text-cyan-default"
//             title="Students" value={120} subtitle="in your category"
//             to="/admin/enrollments" />
//
// `value` may be a string or number. When `to` is given the card is rendered
// as a <Link> to that route.
import { Link } from 'react-router-dom'

export default function StatCard({ icon, iconBg, title, value, subtitle, to, className = '' }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted font-semibold">
          {title}
        </span>
        {icon && (
          <span className={`w-9 h-9 rounded-xl grid place-items-center text-base ${iconBg}`} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold tracking-tight leading-none">{value}</div>
      {subtitle && <p className="text-xs text-muted m-0">{subtitle}</p>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={`stat-card no-underline ${className}`.trim()}>
        {inner}
      </Link>
    )
  }
  return <div className={`stat-card ${className}`.trim()}>{inner}</div>
}