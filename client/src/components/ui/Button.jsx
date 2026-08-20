import React from 'react'
import { useTheme } from '../../context/ThemeToggleContext'

const Button = React.forwardRef(function Button(
  { 
    variant = 'primary', 
    loading = false, 
    leftIcon, 
    rightIcon, 
    fullWidth,
    children,
    disabled,
    className = '',
    onClick,
    ...props 
  },
  ref
) {
  const { isDark } = useTheme()
  
  const baseClasses =
    'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium ' +
    'transition-all duration-200 focus:outline-none focus:ring-2 ' +
    "focus:ring-" + (isDark ? 'primary' : 'primary-container') + ' ' +
    'disabled:cursor-not-allowed disabled:opacity-50 ' +
    (fullWidth ? 'w-full ' : '') +
    className

  const variants = {
    primary:
      'bg-primary text-on-primary shadow-glow hover:shadow-glow-hover ' +
      'btn-sheen',
    secondary:
      'bg-surface-container-high text-on-surface hover:bg-surface-container-highest ' +
      'border border-outline-variant',
    outline:
      'bg-surface-container-high text-on-surface border border-outline ' +
      'hover:bg-surface-container-highest',
    ghost:
      'bg-transparent text-on-surface hover:bg-surface-container-low',
    danger:
      'bg-error-container text-on-error-container border border-error ' +
      'hover:bg-error hover:text-on-error',
  }

  const handleChange = (e) => {
    if (!disabled && !loading) {
      onClick?.(e)
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={baseClasses + ' ' + variants[variant]}
      onClick={handleChange}
      {...props}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
      )}
      {!loading && leftIcon && (
        <span className="material-symbols-outlined">{leftIcon}</span>
      )}
      <span className={loading ? 'opacity-80' : ''}>
        {loading ? 'Loading…' : children}
      </span>
      {!loading && rightIcon && (
        <span className="material-symbols-outlined">
          {rightIcon}
        </span>
      )}
    </button>
  )
})

export default Button
