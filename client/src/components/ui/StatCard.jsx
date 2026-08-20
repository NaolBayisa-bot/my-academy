import React from 'react'

const StatCard = React.forwardRef(function StatCard(
  { 
    icon,
    title,
    value,
    trend,
    subtitle,
    iconBg = 'bg-primary-container/20',
    iconColor = 'text-primary',
    className = '',
    ...props 
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={"glass-panel rounded-2xl p-6 flex items-center gap-4 " + className}
      {...props}
    >
      <div className={"flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center " + iconBg}>
        <span className={"material-symbols-outlined " + iconColor + " text-2xl"}>
          {icon}
        </span>
      </div>
      <div className="flex-1">
        {value && (
          <div className="text-2xl font-bold text-on-surface">
            {value}
          </div>
        )}
        {title && (
          <p className="text-sm text-on-surface-variant meta-label">
            {title}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-on-surface-variant mt-0.5">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-sm text-tertiary">
              {trend.up ? 'trending_up' : 'trending_down'}
            </span>
            <span className="text-xs text-tertiary font-medium">
              {trend.value}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

StatCard.displayName = 'StatCard'

export default StatCard
