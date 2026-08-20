import React, { useState } from 'react'

const FormFieldBase = React.forwardRef(function FormFieldBase(
  { 
    label,
    icon,
    error,
    disabled,
    className = '',
    helperText,
    required,
    children,
    ...props 
  },
  ref
) {
  const baseClasses =
    'flex flex-col gap-1.5 ' +
    className

  return (
    <div className={baseClasses}>
      {label && (
        <label className="meta-label text-on-surface-variant flex items-center gap-2">
          {icon && (
            <span className="material-symbols-outlined text-sm">
              {icon}
            </span>
          )}
          {label}
          {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
      </div>
      {error && (
        <span className="text-xs text-error meta-label">{error}</span>
      )}
      {!error && helperText && (
        <span className="text-xs text-on-surface-variant meta-label">
          {helperText}
        </span>
      )}
    </div>
  )
})

const TextInput = React.forwardRef(function TextInput(
  { 
    placeholder,
    type = 'text',
    className = '',
    icon,
    error,
    ...props 
  },
  ref
) {
  const inputClasses =
    'w-full px-3 py-2 rounded-xl border transition-all duration-200 ' +
    'bg-surface-container-high text-on-surface ' +
    'placeholder:text-on-surface-variant/60 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
    (error ? 'border-error focus:ring-error ' : 'border-outline-variant ') +
    (props.disabled ? 'disabled:cursor-not-allowed disabled:opacity-50' : 'cursor-text') +
    ' ' +
    className

  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      className={inputClasses}
      disabled={props.disabled}
      {...props}
    />
  )
})

const TextArea = React.forwardRef(function TextArea(
  { 
    placeholder,
    rows = 4,
    className = '',
    icon,
    error,
    ...props 
  },
  ref
) {
  const textareaClasses =
    'w-full px-3 py-2 rounded-xl border transition-all duration-200 resize-y ' +
    'bg-surface-container-high text-on-surface ' +
    'placeholder:text-on-surface-variant/60 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
    (error ? 'border-error focus:ring-error ' : 'border-outline-variant ') +
    (props.disabled ? 'disabled:cursor-not-allowed disabled:opacity-50' : 'cursor-text') +
    ' ' +
    className

  return (
    <textarea
      ref={ref}
      placeholder={placeholder}
      rows={rows}
      className={textareaClasses}
      disabled={props.disabled}
      {...props}
    />
  )
})

const Select = React.forwardRef(function Select(
  { 
    placeholder,
    className = '',
    icon,
    error,
    children,
    ...props 
  },
  ref
) {
  const selectClasses =
    'w-full px-3 py-2 rounded-xl border transition-all duration-200 ' +
    'bg-surface-container-high text-on-surface ' +
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
    (error ? 'border-error focus:ring-error ' : 'border-outline-variant ') +
    className

  return (
    <select
      ref={ref}
      className={selectClasses}
      disabled={props.disabled}
      {...props}
    >
      {children}
    </select>
  )
})

const PasswordInput = React.forwardRef(function PasswordInput(
  { 
    placeholder,
    className = '',
    ...props 
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false)
  
  const inputClasses =
    'w-full px-3 py-2 pr-10 rounded-xl border transition-all duration-200 ' +
    'bg-surface-container-high text-on-surface ' +
    'placeholder:text-on-surface-variant/60 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
    'border-outline-variant ' +
    (props.disabled ? 'disabled:cursor-not-allowed disabled:opacity-50' : 'cursor-text') +
    ' ' +
    className

  return (
    <div>
      <input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        className={inputClasses}
        disabled={props.disabled}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        <span className="material-symbols-outlined">
          {showPassword ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>
  )
})

FormFieldBase.displayName = 'FormField'

FormFieldBase.TextInput = TextInput
FormFieldBase.TextArea = TextArea
FormFieldBase.Select = Select
FormFieldBase.PasswordInput = PasswordInput

export default FormFieldBase
