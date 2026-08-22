import React from 'react'

const Badge = React.forwardRef(function Badge(
  { 
    status = 'global', 
    children,
    className = '',
    ...props 
  },
  ref
) {
  const statusConfig = {
    pending: {
      bg: 'bg-surface-container-lowest/80',
      text: 'text-on-surface-variant',
      glow: 'shadow-warning',
    },
    in_progress: {
      bg: 'bg-primary-container/20',
      text: 'text-on-primary-container',
      glow: 'shadow-glow-primary',
    },
    completed: {
      bg: 'bg-tertiary-container/20',
      text: 'text-on-tertiary-container',
      glow: 'shadow-glow-tertiary',
    },
    rejected: {
      bg: 'bg-error-container/20',
      text: 'text-on-error-container',
      glow: 'shadow-error',
    },
    global: {
      bg: 'bg-secondary-container/20',
      text: 'text-secondary',
      glow: 'shadow-secondary',
    },
  }

  const config = statusConfig[status]

  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-md ' +
    'backdrop-blur-md ' +
    `${config.bg} ` +
    `${config.text} ` +
    `${config.glow} ` +
    'px-2 py-0.5 text-xs font-medium meta-label ' +
    className

  return (
    <span ref={ref} className={baseClasses} {...props}>
      <span className="rounded-full w-1.5 h-1.5 bg-current opacity-70" />
      <span>{children}</span>
    </span>
  )
})

export default Badge
