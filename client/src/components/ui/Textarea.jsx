// Standard textarea using the shared .textarea-field class.
export default function Textarea({ className = '', ...rest }) {
  return <textarea className={`textarea-field ${className}`.trim()} {...rest} />
}