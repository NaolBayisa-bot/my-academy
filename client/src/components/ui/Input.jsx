// Standard text/email/password input using the shared .input-field class.
// Spread props (value, onChange, type, placeholder, required, ...) onto the
// underlying <input>.
export default function Input({ className = '', ...rest }) {
  return <input className={`input-field ${className}`.trim()} {...rest} />
}