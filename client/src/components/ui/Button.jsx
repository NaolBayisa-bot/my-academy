const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-500 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500 shadow-sm shadow-primary-500/20',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-primary-500 dark:bg-tech-card dark:text-slate-300 dark:border-tech-border dark:hover:bg-tech-border dark:hover:border-primary-500/30',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 dark:hover:bg-red-700',
  ghost:
    'bg-transparent text-slate-500 hover:bg-slate-100 focus:ring-slate-400 dark:text-slate-400 dark:hover:bg-tech-border dark:hover:text-primary-400',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      className={`btn btn-sheen inline-flex items-center justify-center gap-2 font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-tech-surface disabled:opacity-50 disabled:cursor-not-allowed
        rounded-tech
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
