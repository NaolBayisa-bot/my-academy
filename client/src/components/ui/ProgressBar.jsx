import React from 'react'

const ProgressBar = React.forwardRef(function ProgressBar(
  { 
    percentage = 0, 
    color = 'primary',
    label,
    className = '',
    ...props 
  },
  ref
) {
  const colorConfig = {
    primary: {
      fill: 'bg-primary',
      glow: 'shadow-glow-primary',
    },
    tertiary: {
      fill: 'bg-tertiary',
      glow: 'shadow-glow-tertiary',
    },
  }

  const config = colorConfig[color]
  const clampedPercentage = Math.min(100, Math.max(0, percentage))

  const baseClasses =
    'w-full flex items-center gap-3 ' +
    className

  return (
    <div ref={ref} className={baseClasses} {...props}>
      <div className="flex-1">
        <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className={`h-full ${config.fill} ${config.glow} transition-all duration-500`}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
      </div>
      {label && (
        <div className="text-right meta-label">
          {label}: {Math.round(clampedPercentage)}%
        </div>
      )}
    </div>
  )
})

export default ProgressBar
