export default function Select({ label, options, error, id, className = '', ...props }) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-tech border px-3 py-2 text-sm transition-all duration-200 dark:bg-tech-card dark:text-slate-200
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-tech-border'}
          ${className}`}
        {...props}
      >
        {!props.value && <option value="">Select...</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
