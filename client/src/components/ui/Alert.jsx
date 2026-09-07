// Single shared alert banner. `tone` maps to the .alert-* design-system class.
//   tone: error | success | notice | warning
//
// Renders children (or a `message` prop) inside a standard alert container.
export default function Alert({ tone = 'error', message, className = '', children }) {
  const inner = children ?? message
  if (inner == null || inner === '') return null
  return (
    <p className={`alert alert-${tone} ${className}`.trim()}>{inner}</p>
  )
}