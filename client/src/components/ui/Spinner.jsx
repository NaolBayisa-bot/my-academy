import React from 'react'

const Spinner = React.forwardRef(function Spinner(
  { 
    size = 'md',
    className = '',
    ...props 
  },
  ref
) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }

  const baseClasses =
    'text-on-surface-variant animate-spin ' +
    sizeClasses[size] +
    ' ' +
    className

  return (
    <span ref={ref} className={baseClasses} {...props}>
      <span className="material-symbols-outlined">progress_activity</span>
    </span>
  )
})

export default Spinner
