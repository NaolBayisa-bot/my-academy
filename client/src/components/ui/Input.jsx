
export default function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-tech border px-3 py-2 text-sm transition-all duration-200 font-mono
          placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:bg-tech-card dark:text-slate-200
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-tech-border'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
