import React from 'react'

const Alert = React.forwardRef(function Alert(
  { 
    variant = 'info', 
    title,
    message,
    className = '',
    ...props 
  },
  ref
) {
  const variants = {
    error: {
      bg: 'bg-error-container/20',
      border: 'border-error/20',
      text: 'text-on-error-container',
      icon: 'error',
    },
    success: {
      bg: 'bg-tertiary-container/20',
      border: 'border-tertiary/20',
      text: 'text-on-tertiary-container',
      icon: 'check_circle',
    },
    info: {
      bg: 'bg-primary-container/20',
      border: 'border-primary/20',
      text: 'text-on-primary-container',
      icon: 'info',
    },
  }

  const config = variants[variant]

  const baseClasses =
    'flex items-start gap-3 p-4 rounded-xl ' +
    config.bg + ' ' +
    config.border + ' ' +
    config.text + ' ' +
    className

  return (
    <div ref={ref} className={baseClasses} {...props}>
      <span className="material-symbols-outlined flex-shrink-0">
        {config.icon}
      </span>
      <div className="flex-1">
        {title && <div className="font-semibold meta-label">{title}</div>}
        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  )
})

export default Alert
