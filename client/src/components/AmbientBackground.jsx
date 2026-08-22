import React from 'react'

const AmbientBackground = React.forwardRef(function AmbientBackground(
  { 
    grid = false,
    className = '',
    ...props 
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={"absolute inset-0 pointer-events-none -z-10 " + className}
      {...props}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_5%,_transparent_70%)]" />

      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] animate-pulse" />

      <div className="absolute bottom-0 right-0 w-80 h-80 bg-inverse-primary/10 dark:bg-inverse-primary/5 blur-[100px] animate-pulse delay-700" />

      {grid && (
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0v40" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3 }} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      )}
    </div>
  )
})

AmbientBackground.displayName = 'AmbientBackground'

export default AmbientBackground
