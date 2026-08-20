import React from 'react'

const EmptyState = React.forwardRef(function EmptyState(
  { 
    icon = 'sentiment_satisfied',
    title = 'Nothing here yet',
    message = 'There's nothing to show in this section.',
    actionLabel,
    onAction,
    className = '',
    ...props 
  },
  ref
) {
  const baseClasses =
    'flex flex-col items-center justify-center gap-4 p-8 ' +
    'rounded-xl ' +
    'bg-surface-container-low ' +
    className

  return (
    <div ref={ref} className={baseClasses} {...props}>
      <div className="flex flex-col items-center gap-2">
        <div className="p-4 rounded-full bg-surface-container-high shadow-glass">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl">
            {icon}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-on-surface meta-label">
          {title}
        </h3>
        <p className="text-on-surface-variant text-center max-w-xs">
          {message}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-2 text-sm font-medium text-on-primary-container hover:bg-primary-container/10 border border-primary rounded-full transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
})

export default EmptyState
