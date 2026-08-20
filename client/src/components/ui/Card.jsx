import React from 'react'

const Card = React.forwardRef(function Card(
  { 
    children, 
    padding = 'p-6',
    hoverLift = false,
    className = '',
    ...props 
  },
  ref
) {
  const baseClasses =
    'glass-panel rounded-xl ' +
    `${padding} ` +
    `${hoverLift ? 'hover:-translate-y-2 transition-all duration-300' : ''} ` +
    className

  return (
    <div
      ref={ref}
      className={baseClasses}
      {...props}
    >
      {children}
    </div>
  )
})

export default Card
