// Standard select using the shared .select-field class. Adds a dark dropdown
// option background so native <option>s match the theme on both browsers.
export default function Select({ className = '', children, ...rest }) {
  return (
    <select
      className={`select-field [&>option]:bg-[#0d1623] ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  )
}